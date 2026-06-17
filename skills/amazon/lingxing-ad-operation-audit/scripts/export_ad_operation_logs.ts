import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface ToolTextContent {
  type: string;
  text?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function csvEnv(name: string): string[] | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function parseToolResult(result: unknown): Record<string, unknown> {
  const content = (result as { content?: ToolTextContent[] })?.content ?? [];
  const text = content.find((item) => item.type === "text")?.text ?? "";
  if (!text) throw new Error("MCP tool returned no text content");
  return JSON.parse(text) as Record<string, unknown>;
}

function scalarOrArray(values: string[] | undefined): string | string[] | undefined {
  if (!values || values.length === 0) return undefined;
  return values.length === 1 ? values[0] : values;
}

const endpoint = process.env.LINGXING_PUBLIC_MCP_URL ?? "https://mcp.nexgaios.com/mcp-services/lingxing-mcp";
const key = requiredEnv("LINGXING_REMOTE_MCP_KEY");

const sid = requiredEnv("LINGXING_AD_AUDIT_SID");
const country = requiredEnv("LINGXING_AD_AUDIT_COUNTRY");
const startDate = process.env.LINGXING_AD_AUDIT_START_DATE ?? dateDaysAgo(89);
const endDate = process.env.LINGXING_AD_AUDIT_END_DATE ?? dateDaysAgo(0);
const outputPath = resolve(process.env.LINGXING_AD_AUDIT_OUTPUT ?? "artifacts/lingxing-ad-operation-audit/data/export.json");
const maxRecords = Number(process.env.LINGXING_AD_AUDIT_MAX_RECORDS ?? "100000");
const pageLength = Number(process.env.LINGXING_AD_AUDIT_PAGE_LENGTH ?? "100");
const timeoutMs = Number(process.env.LINGXING_AD_AUDIT_TIMEOUT_MS ?? "300000");

const filters: Record<string, unknown> = {
  log_source: process.env.LINGXING_AD_AUDIT_LOG_SOURCE ?? "all",
  max_records: maxRecords,
};

const sponsoredType = scalarOrArray(csvEnv("LINGXING_AD_AUDIT_SPONSORED_TYPE"));
const operateType = scalarOrArray(csvEnv("LINGXING_AD_AUDIT_OPERATE_TYPE"));
const variableCode = scalarOrArray(csvEnv("LINGXING_AD_AUDIT_VARIABLE_CODE"));
const changeType = scalarOrArray(csvEnv("LINGXING_AD_AUDIT_CHANGE_TYPE"));

if (sponsoredType) filters.sponsored_type = sponsoredType;
if (operateType) filters.operate_type = operateType;
if (variableCode) filters.variable_code = variableCode;
if (changeType) filters.change_type = changeType;
if (process.env.LINGXING_AD_AUDIT_CAMPAIGN_QUERY) filters.campaign_query = process.env.LINGXING_AD_AUDIT_CAMPAIGN_QUERY;
if (process.env.LINGXING_AD_AUDIT_USER_QUERY) filters.user_query = process.env.LINGXING_AD_AUDIT_USER_QUERY;

const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
  requestInit: { headers: { "X-Mcp-Key": key } },
});
const client = new Client({ name: "lingxing-ad-operation-audit-export", version: "0.1.0" });

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  if (!toolNames.includes("lingxing_ad_operation_log_scan")) {
    throw new Error(`lingxing_ad_operation_log_scan is not visible. Visible tools: ${toolNames.join(", ")}`);
  }

  const argumentsPayload = {
    scope: { sid: [sid], country: [country] },
    date_range: { start_date: startDate, end_date: endDate },
    filters,
    pagination: { length: pageLength },
    output: { format: "records", include_metadata: true },
  };

  const result = await client.callTool({
    name: "lingxing_ad_operation_log_scan",
    arguments: argumentsPayload,
  }, undefined, { timeout: timeoutMs });
  const parsed = parseToolResult(result);

  const safeExport = {
    exported_at: new Date().toISOString(),
    endpoint,
    arguments: argumentsPayload,
    visible_tools: toolNames,
    result: parsed,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(safeExport, null, 2), "utf8");

  const data = Array.isArray(parsed.data) ? parsed.data : [];
  console.log(JSON.stringify({
    output: outputPath,
    ok: parsed.ok,
    records: data.length,
    summary: parsed.summary,
  }, null, 2));
} finally {
  await transport.terminateSession().catch(() => undefined);
  await client.close().catch(() => undefined);
}
