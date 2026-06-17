import "dotenv/config";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface ToolTextContent {
  type: string;
  text?: string;
}

interface LogExport {
  arguments?: {
    scope?: Record<string, unknown>;
    date_range?: { start_date?: string; end_date?: string };
  };
  result?: {
    data?: Array<Record<string, unknown>>;
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function csvEnv(name: string, fallback: string[]): string[] {
  const value = process.env[name];
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : fallback;
}

function parseToolResult(result: unknown): Record<string, unknown> {
  const content = (result as { content?: ToolTextContent[] })?.content ?? [];
  const text = content.find((item) => item.type === "text")?.text ?? "";
  if (!text) throw new Error("MCP tool returned no text content");
  return JSON.parse(text) as Record<string, unknown>;
}

function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = parseDate(start);
  const endDate = parseDate(end);
  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(formatDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

async function callTool(client: Client, name: string, args: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown>> {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: timeoutMs });
  return parseToolResult(result);
}

async function fetchAllReportRows(
  client: Client,
  reportType: string,
  scope: Record<string, unknown>,
  reportDate: string,
  pageLength: number,
  timeoutMs: number,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  let total: number | undefined;

  while (total === undefined || offset < total) {
    const envelope = await callTool(
      client,
      "lingxing_ad_report",
      {
        report_type: reportType,
        scope,
        date_range: { report_date: reportDate },
        pagination: { offset, length: pageLength },
        output: { format: "records", include_metadata: true },
      },
      timeoutMs,
    );
    if (envelope.ok !== true) {
      throw new Error(`${reportType} ${reportDate} failed: ${String(envelope.error ?? "unknown error")}`);
    }
    const data = Array.isArray(envelope.data) ? (envelope.data as Record<string, unknown>[]) : [];
    total = Number((envelope.pagination as { total?: unknown } | undefined)?.total ?? data.length);
    rows.push(...data);
    if (data.length === 0) break;
    offset += pageLength;
  }

  return rows;
}

const endpoint = process.env.LINGXING_PUBLIC_MCP_URL ?? "https://mcp.nexgaios.com/mcp-services/lingxing-mcp";
const key = requiredEnv("LINGXING_REMOTE_MCP_KEY");
const inputPath = resolve(process.env.LINGXING_AD_IMPACT_INPUT ?? "artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-90d.json");
const outputPath = resolve(process.env.LINGXING_AD_IMPACT_OUTPUT ?? "artifacts/lingxing-ad-operation-audit/data/hk-aoka-us-performance-context.json");
const windowDays = Number(process.env.LINGXING_AD_IMPACT_WINDOW_DAYS ?? "7");
const pageLength = Number(process.env.LINGXING_AD_IMPACT_PAGE_LENGTH ?? "500");
const timeoutMs = Number(process.env.LINGXING_AD_IMPACT_TIMEOUT_MS ?? "300000");
const reportTypes = csvEnv("LINGXING_AD_IMPACT_REPORT_TYPES", ["sp_campaign_reports", "sp_keyword_reports"]);

const logExport = JSON.parse(await readFile(inputPath, "utf8")) as LogExport;
const exportRange = logExport.arguments?.date_range;
if (!exportRange?.start_date || !exportRange?.end_date) {
  throw new Error("Input export is missing arguments.date_range.start_date/end_date");
}

const records = Array.isArray(logExport.result?.data) ? logExport.result.data : [];
const scope = { ...(logExport.arguments?.scope ?? {}) };
const profileIds = Array.from(
  new Set(records.map((record) => record.profile_id).filter((value) => value !== undefined && value !== null && value !== "").map(String)),
);
if (!scope.profile_id && profileIds.length === 1) {
  scope.profile_id = [profileIds[0]];
}
const startDate = addDays(exportRange.start_date, -windowDays);
const endDate = exportRange.end_date;
const dates = dateRange(startDate, endDate);

const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
  requestInit: { headers: { "X-Mcp-Key": key } },
});
const client = new Client({ name: "lingxing-ad-performance-context-export", version: "0.1.3" });

const reportRows: Record<string, Record<string, unknown>[]> = {};
const errors: Array<{ report_type: string; report_date: string; error: string }> = [];
let calls = 0;

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name);
  if (!toolNames.includes("lingxing_ad_report")) {
    throw new Error(`lingxing_ad_report is not visible. Visible tools: ${toolNames.sort().join(", ")}`);
  }

  for (const reportType of reportTypes) {
    reportRows[reportType] = [];
    for (const reportDate of dates) {
      try {
        const rows = await fetchAllReportRows(client, reportType, scope, reportDate, pageLength, timeoutMs);
        calls += Math.max(1, Math.ceil(rows.length / pageLength));
        reportRows[reportType].push(...rows);
      } catch (error) {
        errors.push({
          report_type: reportType,
          report_date: reportDate,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const payload = {
    exported_at: new Date().toISOString(),
    endpoint,
    source_log_export: inputPath,
    scope,
    window_days: windowDays,
    date_range: { start_date: startDate, end_date: endDate },
    report_types: reportTypes,
    rows: reportRows,
    metadata: { calls, errors },
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(JSON.stringify({
    output: outputPath,
    report_types: reportTypes,
    date_range: payload.date_range,
    rows: Object.fromEntries(Object.entries(reportRows).map(([key, value]) => [key, value.length])),
    errors: errors.length,
  }, null, 2));
} finally {
  await transport.terminateSession().catch(() => undefined);
  await client.close().catch(() => undefined);
}
