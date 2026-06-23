import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const skillsRoot = path.join(repoRoot, "skills");
const defaultWatchHost = "127.0.0.1";
const defaultWatchPort = 4319;
const watchIgnoredDirs = new Set([".git", "node_modules", "__pycache__", ".pytest_cache"]);
const changedIgnoredDirs = new Set([".git", "node_modules", "__pycache__", ".pytest_cache", ".mypy_cache"]);
const changedIgnoredExtensions = new Set([".pyc", ".pyo", ".log"]);

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".txt",
  ".yaml",
  ".yml"
]);

const localPathPattern = /(?:^|[`"'(\s])((?:(?:agents|assets|impact|references|scripts|tests)\/[A-Za-z0-9._/-]+)|(?:SKILL|README|CHANGELOG)\.md|(?:skill|impact)\.ya?ml)(?=$|[`"'),\s])/g;

export function impactCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const all = Boolean(flags.all);
  const strict = Boolean(flags.strict);
  const visualize = Boolean(flags.visualize);
  const base = flags.base ? String(flags.base) : "";
  const changed = changedFiles(base);
  const skills = all ? loadSkills() : resolveSkills(positionals);

  if (!all && skills.length === 0) {
    throw new Error("缺少 skill-id。用法：pnpm skill:impact <skill-id>|--all [--base <git-range>] [--strict] [--visualize]");
  }

  const reports = [];
  for (const skill of skills) {
    const report = analyzeSkillImpact(skill, changed, { strict });
    if (report) {
      reports.push(report);
    }
  }

  if (reports.length === 0) {
    console.log("没有找到需要 impact 检查的 skill。");
    return;
  }

  printImpactReports(reports, { strict, base, changed });

  if (visualize) {
    writeVisualizations(reports, flags);
  }

  const failures = reports.flatMap((report) => report.failures);
  if (failures.length > 0) {
    throw new Error(`impact 检查失败：${failures.length} 个问题需要处理。`);
  }
}

export async function impactWatchCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  if (flags.all) {
    throw new Error("impact-watch MVP 只支持单个 skill。请使用：pnpm skill:impact:watch <skill-id>");
  }
  if (positionals.length === 0) {
    throw new Error("缺少 skill-id。用法：pnpm skill:impact:watch <skill-id> [--port <port>] [--host <host>]");
  }

  const [skill] = resolveSkills([positionals[0]]);
  const host = flags.host ? String(flags.host) : defaultWatchHost;
  const port = parsePort(flags.port || defaultWatchPort);
  const consolePath = path.join(skill.dir, "impact", "console.html");
  let currentState = buildConsoleState(skill);
  const clients = new Set();

  const broadcast = () => {
    currentState = buildConsoleState(skill);
    for (const client of clients) {
      sendSse(client, "graph", currentState);
    }
  };
  const scheduleBroadcast = debounce(broadcast, 250);
  const closeWatchers = watchSkillDir(skill.dir, scheduleBroadcast);

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
    if (requestUrl.pathname === "/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        Connection: "keep-alive"
      });
      response.write(": connected\n\n");
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }

    if (requestUrl.pathname === "/api/state") {
      sendJson(response, currentState);
      return;
    }

    if (requestUrl.pathname === "/healthz") {
      sendJson(response, { ok: true, skill: skill.id });
      return;
    }

    if (requestUrl.pathname === "/" || requestUrl.pathname === "/console.html") {
      sendHtml(response, readConsoleHtml(consolePath));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });

  await listen(server, port, host);
  const url = `http://${host}:${port}/`;
  console.log(`Skill Impact Console 已启动：${url}`);
  console.log(`监控 skill：${skill.id}`);
  console.log("按 Ctrl+C 关闭 server。");

  await new Promise((resolve) => {
    const shutdown = () => {
      closeWatchers();
      for (const client of clients) {
        client.end();
      }
      clients.clear();
      server.close(() => resolve());
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}

export function analyzeSkillImpact(skill, changedFilesList, options = {}) {
  const configPath = path.join(skill.dir, "impact.yaml");
  const normalizedChanged = changedFilesList.map(normalizePath);
  const skillChangedFiles = normalizedChanged.filter((file) => file.startsWith(`${skill.relativeDir}/`));

  if (!fs.existsSync(configPath)) {
    if (skillChangedFiles.length > 0 && options.requireConfig) {
      return {
        skill,
        skipped: false,
        changes: skillChangedFiles,
        failures: [{
          file: skill.relativeDir,
          reason: "该 skill 有变更，但缺少 impact.yaml。"
        }],
        warnings: [],
        contracts: [],
        graph: null
      };
    }
    return null;
  }

  const config = loadImpactConfig(configPath);
  const graph = buildSkillGraph(skill, config);
  const reviewEvidence = loadReviewEvidence(skill, normalizedChanged, config);
  const failures = [];
  const warnings = [];
  const contractReports = [];

  for (const broken of graph.brokenReferences) {
    failures.push({
      file: broken.from,
      reason: `引用的本 skill 文件不存在：${broken.to}`
    });
  }

  for (const file of skillChangedFiles) {
    const skillRelative = file.slice(skill.relativeDir.length + 1);
    if (skillRelative === "impact.yaml") {
      continue;
    }
    if (isIgnored(skillRelative, config)) {
      continue;
    }
    if (!graph.coveredFiles.has(skillRelative)) {
      failures.push({
        file,
        reason: "变更文件没有出现在自动引用图或 impact.yaml 契约组中。请加入契约组或明确忽略。"
      });
    }
  }

  for (const contract of config.contracts) {
    const sourceMatches = expandPatterns(contract.sources, graph.files);
    const witnessMatches = expandPatterns(contract.witnesses, graph.files);
    const changedSources = sourceMatches.filter((file) => skillChangedFiles.includes(repoFile(skill, file)));

    if (changedSources.length === 0) {
      continue;
    }

    const missingWitnesses = [];
    for (const witness of witnessMatches) {
      const repoWitness = repoFile(skill, witness);
      const changed = skillChangedFiles.includes(repoWitness);
      const reviewed = reviewEvidence.has(witness);
      if (!changed && !reviewed) {
        missingWitnesses.push(witness);
      }
    }

    const contractReport = {
      id: contract.id,
      changedSources,
      witnessCount: witnessMatches.length,
      missingWitnesses
    };
    contractReports.push(contractReport);

    if (missingWitnesses.length > 0 && contract.requires.has("witness_changed_or_reviewed")) {
      failures.push({
        file: repoFile(skill, changedSources[0]),
        reason: `契约 ${contract.id} 的 witness 未变更也无审查回执：${missingWitnesses.join(", ")}`
      });
    }

    if (contract.requires.has("version_changed_or_reviewed")) {
      for (const versionFile of ["skill.yaml", "CHANGELOG.md"]) {
        const changed = skillChangedFiles.includes(repoFile(skill, versionFile));
        const reviewed = reviewEvidence.has(versionFile);
        if (!changed && !reviewed) {
          failures.push({
            file: repoFile(skill, versionFile),
            reason: `契约 ${contract.id} 要求版本/变更记录同步检查，但 ${versionFile} 未变更也无审查回执。`
          });
        }
      }
    }
  }

  const versionFailure = validateVersionContract(skill);
  if (versionFailure) {
    failures.push(versionFailure);
  }

  if (skillChangedFiles.length === 0 && graph.brokenReferences.length === 0) {
    warnings.push("impact.yaml 存在，但当前没有该 skill 的变更。");
  }

  return {
    skill,
    skipped: false,
    changes: skillChangedFiles,
    failures,
    warnings,
    contracts: contractReports,
    reviewEvidence: [...reviewEvidence],
    graph: toGraphModel(skill, config, graph, skillChangedFiles)
  };
}

function buildConsoleState(skill) {
  const changeEntries = changedFileEntries("");
  const changed = changeEntries.map((entry) => entry.file);
  const report = analyzeSkillImpact(skill, changed, { strict: true, requireConfig: true });

  if (!report) {
    return {
      generatedAt: new Date().toISOString(),
      skill: {
        id: skill.id,
        domain: skill.domain,
        version: skill.version,
        relativeDir: skill.relativeDir
      },
      summary: {
        status: "skipped",
        changedFiles: 0,
        failureCount: 0,
        warningCount: 0,
        activeContracts: 0
      },
      changes: [],
      diagnostics: [],
      tasks: [],
      graph: { nodes: [], edges: [], contracts: [] }
    };
  }

  if (!report.graph) {
    return {
      generatedAt: new Date().toISOString(),
      skill: {
        id: skill.id,
        domain: skill.domain,
        version: skill.version,
        relativeDir: skill.relativeDir
      },
      summary: {
        status: report.failures.length > 0 ? "failing" : "skipped",
        changedFiles: report.changes.length,
        failureCount: report.failures.length,
        warningCount: report.warnings.length,
        activeContracts: 0,
        taskCount: report.failures.length
      },
      changes: [],
      diagnostics: [
        ...report.failures.map((failure) => ({ level: "error", ...failure })),
        ...report.warnings.map((warning) => ({ level: "warning", file: "", reason: warning }))
      ],
      tasks: buildConsoleTasks(report),
      graph: { nodes: [], edges: [], contracts: [] }
    };
  }

  const skillChangeEntries = changeEntries
    .filter((entry) => entry.file.startsWith(`${skill.relativeDir}/`))
    .map((entry) => ({
      ...entry,
      skillFile: entry.file.slice(skill.relativeDir.length + 1)
    }));
  const graph = decorateConsoleGraph(report, skillChangeEntries);
  const diagnostics = [
    ...report.failures.map((failure) => ({ level: "error", ...failure })),
    ...report.warnings.map((warning) => ({ level: "warning", file: "", reason: warning }))
  ];
  const tasks = buildConsoleTasks(report);

  return {
    generatedAt: new Date().toISOString(),
    skill: graph.skill,
    summary: {
      status: report.failures.length > 0 ? "failing" : "passing",
      changedFiles: report.changes.length,
      failureCount: report.failures.length,
      warningCount: report.warnings.length,
      activeContracts: report.contracts.length,
      taskCount: tasks.length
    },
    changes: skillChangeEntries,
    diagnostics,
    tasks,
    graph
  };
}

function decorateConsoleGraph(report, changeEntries) {
  const graph = structuredClone(report.graph);
  const changeKindByFile = new Map(changeEntries.map((entry) => [entry.skillFile, entry.kind]));
  const nodes = new Map(graph.nodes.map((node) => [node.id, { ...node, status: [], contracts: [] }]));
  const addStatus = (id, status) => {
    const node = nodes.get(id);
    if (node && !node.status.includes(status)) {
      node.status.push(status);
    }
  };

  for (const node of nodes.values()) {
    if (node.kind !== "file") {
      continue;
    }
    const changeKind = changeKindByFile.get(node.file);
    if (changeKind) {
      addStatus(node.id, changeKind);
      addStatus(node.id, "changed");
    } else {
      addStatus(node.id, "clean");
    }
    if (node.changed && !node.covered) {
      addStatus(node.id, "orphan");
    }
    if (report.reviewEvidence.includes(node.file)) {
      addStatus(node.id, "reviewed");
    }
    for (const role of node.roles) {
      const [roleKind, contractId] = role.split(":");
      if (contractId) {
        node.contracts.push({ role: roleKind, id: contractId });
      }
      if (node.changed && roleKind === "source") {
        addStatus(node.id, "source-changed");
      }
      if (node.changed && roleKind === "witness") {
        addStatus(node.id, "updated");
      }
    }
  }

  for (const entry of changeEntries) {
    const id = `file:${entry.skillFile}`;
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        label: entry.skillFile,
        kind: "file",
        file: entry.skillFile,
        changed: true,
        covered: false,
        category: fileCategory(entry.skillFile),
        roles: [],
        contracts: [],
        status: [entry.kind, "changed", "orphan"]
      });
    }
  }

  for (const contract of report.contracts) {
    addStatus(`contract:${contract.id}`, contract.missingWitnesses.length > 0 ? "failing" : "active");
    for (const source of contract.changedSources) {
      addStatus(`file:${source}`, "source-changed");
    }
    for (const witness of contract.missingWitnesses) {
      addStatus(`file:${witness}`, "witness-pending");
    }
  }

  for (const broken of graph.brokenReferences) {
    addStatus(`missing:${broken.to}`, "broken-reference");
    addStatus(`missing:${broken.to}`, "missing");
  }

  const activeContracts = new Map(report.contracts.map((contract) => [contract.id, contract]));
  graph.nodes = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  graph.contracts = graph.contracts.map((contract) => ({
    ...contract,
    active: activeContracts.has(contract.id),
    current: activeContracts.get(contract.id) || {
      id: contract.id,
      changedSources: [],
      witnessCount: 0,
      missingWitnesses: []
    }
  }));
  return graph;
}

function buildConsoleTasks(report) {
  const tasks = [];
  for (const failure of report.failures) {
    const kind = classifyFailure(failure.reason);
    tasks.push({
      id: stableCanvasId(`${failure.file}:${failure.reason}`),
      kind,
      severity: "error",
      priority: taskPriority(kind),
      file: failure.file,
      reason: failure.reason,
      action: actionForFailure(kind)
    });
  }

  for (const contract of report.contracts) {
    for (const witness of contract.missingWitnesses) {
      const file = repoFile(report.skill, witness);
      const kind = "witness-pending";
      tasks.push({
        id: stableCanvasId(`${contract.id}:${witness}`),
        kind,
        severity: "error",
        priority: taskPriority(kind),
        file,
        contract: contract.id,
        reason: `契约 ${contract.id} 需要同步或审查 witness：${witness}`,
        action: "更新该 witness，或在 docs/impact-reviews 中补充明确的审查回执。"
      });
    }
  }

  const seen = new Set();
  return tasks
    .filter((task) => {
      const key = `${task.kind}:${task.file}:${task.reason}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.priority - right.priority || left.file.localeCompare(right.file));
}

function classifyFailure(reason) {
  if (reason.includes("引用的本 skill 文件不存在")) {
    return "broken-reference";
  }
  if (reason.includes("没有出现在自动引用图或 impact.yaml 契约组")) {
    return "orphan";
  }
  if (reason.includes("witness 未变更")) {
    return "witness-pending";
  }
  if (reason.includes("版本/变更记录")) {
    return "version-pending";
  }
  return "strict-failure";
}

function taskPriority(kind) {
  return {
    "broken-reference": 1,
    orphan: 2,
    "witness-pending": 3,
    "version-pending": 4,
    "strict-failure": 5
  }[kind] || 9;
}

function actionForFailure(kind) {
  return {
    "broken-reference": "修复 Markdown 或 YAML 中的本地文件引用，或补回缺失文件。",
    orphan: "把该文件加入 impact.yaml 契约组、建立本地引用链，或明确加入 ignored_files。",
    "witness-pending": "同步相关 witness 文件，或补充机器可读审查回执。",
    "version-pending": "更新 skill.yaml/CHANGELOG.md，或补充明确的版本审查回执。",
    "strict-failure": "按 strict 检查原因补齐维护闭环。"
  }[kind] || "按 strict 检查原因补齐维护闭环。";
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`无效端口：${value}`);
  }
  return port;
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    server.once("error", onError);
    server.listen(port, host, () => {
      server.off("error", onError);
      resolve();
    });
  });
}

function readConsoleHtml(consolePath) {
  if (fs.existsSync(consolePath)) {
    return fs.readFileSync(consolePath, "utf8");
  }
  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<title>Skill Impact Console</title>
<body>
<h1>Skill Impact Console</h1>
<p>未找到控制台前端文件：${escapeHtml(relative(consolePath))}</p>
</body>
</html>`;
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(html);
}

function sendJson(response, data) {
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(`${JSON.stringify(data, null, 2)}\n`);
}

function sendSse(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function watchSkillDir(skillDir, onChange) {
  const watchers = new Map();
  let refreshTimer = null;

  const shouldWatch = (dir) => {
    const relativeDir = normalizePath(path.relative(skillDir, dir));
    return !relativeDir.split("/").some((part) => watchIgnoredDirs.has(part));
  };

  const attach = (dir) => {
    if (!shouldWatch(dir) || watchers.has(dir)) {
      return;
    }
    try {
      const watcher = fs.watch(dir, () => {
        onChange();
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => attachAll(), 500);
      });
      watchers.set(dir, watcher);
    } catch {
      return;
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        attach(path.join(dir, entry.name));
      }
    }
  };

  const attachAll = () => attach(skillDir);
  attachAll();

  return () => {
    clearTimeout(refreshTimer);
    for (const watcher of watchers.values()) {
      watcher.close();
    }
    watchers.clear();
  };
}

function debounce(callback, delay) {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}

function printImpactReports(reports, context) {
  console.log("## Impact 检查");
  console.log("");
  console.log(`基准：${context.base || "当前工作区变更"}`);
  console.log(`模式：${context.strict ? "strict" : "report"}`);
  console.log("");

  for (const report of reports) {
    console.log(`### ${report.skill.id}`);
    console.log("");

    if (report.changes.length === 0) {
      console.log("- 当前没有该 skill 的文件变更。");
    } else {
      console.log("- 变更文件：");
      for (const file of report.changes.slice(0, 30)) {
        console.log(`  - ${file}`);
      }
      if (report.changes.length > 30) {
        console.log(`  - 另有 ${report.changes.length - 30} 个文件未列出。`);
      }
    }

    if (report.contracts.length > 0) {
      console.log("- 命中的契约：");
      for (const contract of report.contracts) {
        console.log(`  - ${contract.id}：source ${contract.changedSources.join(", ")}；witness ${contract.witnessCount} 个`);
      }
    }

    if (report.reviewEvidence.length > 0) {
      console.log(`- 审查回执覆盖：${report.reviewEvidence.join(", ")}`);
    }

    if (report.warnings.length > 0) {
      console.log("- 警告：");
      for (const warning of report.warnings) {
        console.log(`  - ${warning}`);
      }
    }

    if (report.failures.length > 0) {
      console.log("- 失败：");
      for (const failure of report.failures) {
        console.log(`  - ${failure.file}: ${failure.reason}`);
      }
    } else {
      console.log("- 结果：通过。");
    }

    console.log("");
  }
}

function buildSkillGraph(skill, config) {
  const files = listSkillFiles(skill.dir);
  const existing = new Set(files);
  const coveredFiles = new Set();
  const brokenReferences = [];
  const edges = [];

  for (const contract of config.contracts) {
    const contractId = `contract:${contract.id}`;
    for (const file of expandPatterns(contract.sources, files)) {
      edges.push({ from: `file:${file}`, to: contractId, relation: "source", contract: contract.id });
      coveredFiles.add(file);
    }
    for (const file of expandPatterns(contract.witnesses, files)) {
      edges.push({ from: contractId, to: `file:${file}`, relation: "witness", contract: contract.id });
      coveredFiles.add(file);
    }
  }

  for (const file of files) {
    const absolutePath = path.join(skill.dir, file);
    if (!isTextFile(absolutePath)) {
      continue;
    }
    const content = fs.readFileSync(absolutePath, "utf8");
    const references = extractLocalReferences(content);
    for (const reference of references) {
      if (existing.has(reference)) {
        coveredFiles.add(file);
        coveredFiles.add(reference);
        edges.push({ from: `file:${file}`, to: `file:${reference}`, relation: "mentions" });
      } else {
        brokenReferences.push({ from: repoFile(skill, file), to: reference });
        edges.push({ from: `file:${file}`, to: `missing:${reference}`, relation: "missing" });
      }
    }
  }

  const skillYamlPath = path.join(skill.dir, "skill.yaml");
  if (fs.existsSync(skillYamlPath)) {
    const skillYaml = fs.readFileSync(skillYamlPath, "utf8");
    const entry = firstYamlValue(skillYaml, "entry");
    if (entry) {
      if (existing.has(entry)) {
        coveredFiles.add("skill.yaml");
        coveredFiles.add(entry);
        edges.push({ from: "file:skill.yaml", to: `file:${entry}`, relation: "entry" });
      } else {
        brokenReferences.push({ from: repoFile(skill, "skill.yaml"), to: entry });
        edges.push({ from: "file:skill.yaml", to: `missing:${entry}`, relation: "missing" });
      }
    }

    for (const commandRef of extractLocalReferences(skillYaml)) {
      if (existing.has(commandRef)) {
        coveredFiles.add("skill.yaml");
        coveredFiles.add(commandRef);
        edges.push({ from: "file:skill.yaml", to: `file:${commandRef}`, relation: "command" });
      }
    }
  }

  coveredFiles.add("impact.yaml");

  return { files, coveredFiles, brokenReferences, edges };
}

function toGraphModel(skill, config, graph, skillChangedFiles) {
  const nodes = new Map();
  const changed = new Set(skillChangedFiles.map((file) => file.slice(skill.relativeDir.length + 1)));

  for (const file of graph.files) {
    nodes.set(`file:${file}`, {
      id: `file:${file}`,
      label: file,
      kind: "file",
      file,
      changed: changed.has(file),
      covered: graph.coveredFiles.has(file),
      category: fileCategory(file),
      roles: []
    });
  }

  for (const contract of config.contracts) {
    nodes.set(`contract:${contract.id}`, {
      id: `contract:${contract.id}`,
      label: contract.id,
      kind: "contract",
      description: contract.description || "",
      roles: ["contract"]
    });
    for (const source of expandPatterns(contract.sources, graph.files)) {
      addNodeRole(nodes, `file:${source}`, `source:${contract.id}`);
    }
    for (const witness of expandPatterns(contract.witnesses, graph.files)) {
      addNodeRole(nodes, `file:${witness}`, `witness:${contract.id}`);
    }
  }

  for (const broken of graph.brokenReferences) {
    nodes.set(`missing:${broken.to}`, {
      id: `missing:${broken.to}`,
      label: broken.to,
      kind: "missing",
      file: broken.to,
      changed: false,
      covered: false,
      category: "missing",
      roles: ["missing"]
    });
  }

  return {
    skill: {
      id: skill.id,
      domain: skill.domain,
      version: skill.version,
      relativeDir: skill.relativeDir
    },
    nodes: [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id)),
    edges: graph.edges,
    contracts: config.contracts.map((contract) => ({
      id: contract.id,
      description: contract.description || "",
      sources: contract.sources,
      witnesses: contract.witnesses,
      requires: [...contract.requires]
    })),
    brokenReferences: graph.brokenReferences
  };
}

function addNodeRole(nodes, id, role) {
  const node = nodes.get(id);
  if (node && !node.roles.includes(role)) {
    node.roles.push(role);
  }
}

function writeVisualizations(reports, flags) {
  const explicitOutput = flags.output || flags.out;
  const outputDir = explicitOutput ? path.resolve(explicitOutput) : "";
  const format = String(flags.format || "all").toLowerCase();
  const allowed = new Set(["all", "markdown", "md", "canvas", "json"]);
  if (!allowed.has(format)) {
    throw new Error("--format 只支持 markdown、canvas、json 或 all。");
  }

  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const report of reports) {
    if (!report.graph) {
      continue;
    }
    const basePath = outputDir
      ? path.join(outputDir, report.skill.id)
      : path.join(report.skill.dir, "impact", "graph");
    fs.mkdirSync(path.dirname(basePath), { recursive: true });
    const outputs = [];
    if (format === "all" || format === "markdown" || format === "md") {
      const filePath = `${basePath}.md`;
      fs.writeFileSync(filePath, renderMarkdownVisualization(report), "utf8");
      outputs.push(relative(filePath));
    }
    if (format === "all" || format === "canvas") {
      const filePath = `${basePath}.canvas`;
      const canvas = renderCanvasVisualization(report);
      validateCanvas(canvas);
      fs.writeFileSync(filePath, `${JSON.stringify(canvas, null, 2)}\n`, "utf8");
      outputs.push(relative(filePath));
    }
    if (format === "all" || format === "json") {
      const filePath = `${basePath}.json`;
      fs.writeFileSync(filePath, `${JSON.stringify(report.graph, null, 2)}\n`, "utf8");
      outputs.push(relative(filePath));
    }
    console.log(`已生成 ${report.skill.id} impact 可视化：${outputs.join(", ")}`);
  }
}

function renderMarkdownVisualization(report) {
  const graph = report.graph;
  const lines = [
    `# ${graph.skill.id} Impact 关系图谱`,
    "",
    "> 此文件由 `pnpm skill:impact <skill-id> --visualize` 生成，用于让用户阅读 impact 契约关系。CI 的事实源仍是 skill 根目录的 `impact.yaml`。",
    "",
    "## 30 秒读法",
    "",
    `- Skill：\`${graph.skill.id}\``,
    `- 版本：\`${graph.skill.version || "未记录"}\``,
    `- 节点数：${graph.nodes.length}`,
    `- 边数：${graph.edges.length}`,
    `- 契约组：${graph.contracts.length}`,
    "",
    "## 图谱",
    "",
    "```mermaid",
    "flowchart LR"
  ];

  const nodeIds = new Map();
  for (const node of graph.nodes) {
    const mermaidId = mermaidNodeId(node.id, nodeIds);
    const label = node.kind === "contract"
      ? `${node.label}<br/>${truncate(node.description, 32)}`
      : node.label;
    lines.push(`  ${mermaidId}["${escapeMermaid(label)}"]:::${mermaidClass(node)}`);
  }

  for (const edge of graph.edges) {
    const from = nodeIds.get(edge.from);
    const to = nodeIds.get(edge.to);
    if (from && to) {
      lines.push(`  ${from} -->|"${edge.relation}"| ${to}`);
    }
  }

  lines.push(
    "  classDef contract fill:#ede9fe,stroke:#7c3aed,color:#111827;",
    "  classDef changed fill:#fef3c7,stroke:#d97706,color:#111827;",
    "  classDef file fill:#f8fafc,stroke:#64748b,color:#111827;",
    "  classDef missing fill:#fee2e2,stroke:#dc2626,color:#111827;",
    "```",
    "",
    "## 契约组",
    "",
    "| 契约 | 说明 | Sources | Witnesses |",
    "| --- | --- | --- | --- |"
  );

  for (const contract of graph.contracts) {
    lines.push(`| \`${contract.id}\` | ${markdownEscape(contract.description)} | ${contract.sources.map(markdownCode).join("<br>")} | ${contract.witnesses.map(markdownCode).join("<br>")} |`);
  }

  lines.push(
    "",
    "## 文件节点",
    "",
    "| 文件 | 类型 | 状态 | 角色 |",
    "| --- | --- | --- | --- |"
  );

  for (const node of graph.nodes.filter((node) => node.kind === "file")) {
    const state = [
      node.changed ? "已变更" : "",
      node.covered ? "已覆盖" : "未覆盖"
    ].filter(Boolean).join(" / ");
    lines.push(`| \`${node.file}\` | ${node.category} | ${state} | ${node.roles.map(markdownCode).join("<br>") || "无"} |`);
  }

  if (graph.brokenReferences.length > 0) {
    lines.push(
      "",
      "## 断裂引用",
      "",
      "| 来源 | 缺失目标 |",
      "| --- | --- |"
    );
    for (const broken of graph.brokenReferences) {
      lines.push(`| \`${broken.from}\` | \`${broken.to}\` |`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function renderCanvasVisualization(report) {
  const graph = report.graph;
  const nodes = [];
  const edges = [];
  const nodeIdMap = new Map();
  const fileNodes = graph.nodes.filter((node) => node.kind !== "contract");
  const contractNodes = graph.nodes.filter((node) => node.kind === "contract");

  const contractStep = 240;
  contractNodes.forEach((node, index) => {
    const id = stableCanvasId(node.id);
    nodeIdMap.set(node.id, id);
    nodes.push({
      id,
      type: "text",
      x: 0,
      y: index * contractStep,
      width: 360,
      height: 120,
      color: "6",
      text: `# ${node.label}\n\n${node.description || "Impact 契约组"}`
    });
  });

  const columns = new Map([
    ["core", { x: -760, y: 0 }],
    ["references", { x: -380, y: 0 }],
    ["assets", { x: 420, y: 0 }],
    ["tests", { x: 800, y: 0 }],
    ["scripts", { x: 800, y: 0 }],
    ["agents", { x: -760, y: 0 }],
    ["missing", { x: 1180, y: 0 }],
    ["other", { x: 1180, y: 0 }]
  ]);
  const columnCounts = new Map();

  for (const node of fileNodes) {
    const column = columns.get(node.category) || columns.get("other");
    const count = columnCounts.get(node.category) || 0;
    columnCounts.set(node.category, count + 1);
    const id = stableCanvasId(node.id);
    nodeIdMap.set(node.id, id);
    nodes.push({
      id,
      type: "text",
      x: column.x,
      y: column.y + count * 120,
      width: 300,
      height: 90,
      color: canvasColor(node),
      text: `${node.changed ? "[changed] " : ""}${node.label}\n\n${node.roles.slice(0, 3).join("\n") || node.category}`
    });
  }

  for (const edge of graph.edges) {
    const fromNode = nodeIdMap.get(edge.from);
    const toNode = nodeIdMap.get(edge.to);
    if (!fromNode || !toNode) {
      continue;
    }
    edges.push({
      id: stableCanvasId(`${edge.from}->${edge.to}:${edge.relation}:${edge.contract || ""}`),
      fromNode,
      fromSide: edge.from.startsWith("file:") ? "right" : "left",
      toNode,
      toSide: edge.to.startsWith("file:") || edge.to.startsWith("missing:") ? "left" : "right",
      toEnd: "arrow",
      label: edge.relation,
      color: edge.relation === "missing" ? "1" : edge.relation === "mentions" ? "5" : "6"
    });
  }

  return { nodes, edges };
}

function validateCanvas(canvas) {
  const nodeIds = new Set(canvas.nodes.map((node) => node.id));
  const edgeIds = new Set();
  if (nodeIds.size !== canvas.nodes.length) {
    throw new Error("Canvas 节点 ID 重复。");
  }
  for (const edge of canvas.edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Canvas 边 ID 重复：${edge.id}`);
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) {
      throw new Error(`Canvas 边引用不存在的节点：${edge.id}`);
    }
  }
}

function mermaidNodeId(rawId, ids) {
  if (ids.has(rawId)) {
    return ids.get(rawId);
  }
  const id = `N_${createHash("sha1").update(rawId).digest("hex").slice(0, 10)}`;
  ids.set(rawId, id);
  return id;
}

function mermaidClass(node) {
  if (node.kind === "contract") {
    return "contract";
  }
  if (node.kind === "missing") {
    return "missing";
  }
  return node.changed ? "changed" : "file";
}

function canvasColor(node) {
  if (node.kind === "missing") {
    return "1";
  }
  if (node.changed) {
    return "3";
  }
  if (!node.covered) {
    return "2";
  }
  return "5";
}

function stableCanvasId(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function fileCategory(file) {
  if (["SKILL.md", "README.md", "CHANGELOG.md", "skill.yaml", "impact.yaml"].includes(file)) {
    return "core";
  }
  const first = file.split("/")[0];
  if (["agents", "assets", "impact", "references", "scripts", "tests"].includes(first)) {
    return first;
  }
  return "other";
}

function escapeMermaid(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function truncate(value, length) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function markdownEscape(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function markdownCode(value) {
  return `\`${String(value || "").replaceAll("`", "\\`")}\``;
}

function loadImpactConfig(configPath) {
  const content = fs.readFileSync(configPath, "utf8");
  const config = {
    version: "",
    ignoredFiles: [],
    reviewRoot: "",
    contracts: []
  };
  let currentContract = null;
  let currentArray = "";

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) {
      continue;
    }

    const topLevel = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (topLevel) {
      currentArray = "";
      const [, key, value] = topLevel;
      if (key === "version") {
        config.version = unquote(value);
      } else if (key === "review_root") {
        config.reviewRoot = unquote(value);
      } else if (key === "ignored_files") {
        currentArray = "ignored_files";
      }
      continue;
    }

    const contractStart = line.match(/^\s*-\s+id:\s*(.+)$/);
    if (contractStart) {
      currentContract = {
        id: unquote(contractStart[1]),
        sources: [],
        witnesses: [],
        requires: new Set()
      };
      config.contracts.push(currentContract);
      currentArray = "";
      continue;
    }

    const contractKey = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (contractKey && currentContract) {
      const [, key, value] = contractKey;
      if (key === "description") {
        currentContract.description = unquote(value);
        currentArray = "";
      } else if (key === "sources" || key === "witnesses" || key === "require") {
        currentArray = key;
      }
      continue;
    }

    const arrayItem = line.match(/^\s*-\s+(.+)$/);
    if (arrayItem) {
      const value = unquote(arrayItem[1]);
      if (currentContract && currentArray === "sources") {
        currentContract.sources.push(value);
      } else if (currentContract && currentArray === "witnesses") {
        currentContract.witnesses.push(value);
      } else if (currentContract && currentArray === "require") {
        currentContract.requires.add(value);
      } else if (!currentContract && currentArray === "ignored_files") {
        config.ignoredFiles.push(value);
      }
    }
  }

  if (config.contracts.length === 0) {
    throw new Error(`${relative(configPath)} 没有定义 contracts。`);
  }

  return config;
}

function loadReviewEvidence(skill, changedFilesList, config) {
  const reviewRoot = normalizePath(config.reviewRoot || `docs/impact-reviews/${skill.id}`);
  const reviewFiles = changedFilesList.filter((file) => file.startsWith(`${reviewRoot}/`) && file.endsWith(".yaml"));
  const evidence = new Set();

  for (const reviewFile of reviewFiles) {
    const absolutePath = path.join(repoRoot, reviewFile);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    const content = fs.readFileSync(absolutePath, "utf8");
    let currentFile = "";
    let currentDecision = "";
    const flush = () => {
      if (currentFile && currentDecision && currentDecision !== "deferred") {
        evidence.add(normalizePath(currentFile));
      }
    };

    for (const line of content.split(/\r?\n/)) {
      const fileMatch = line.match(/^\s*-\s+file:\s*(.+)$/) || line.match(/^\s+file:\s*(.+)$/);
      if (fileMatch) {
        flush();
        currentFile = unquote(fileMatch[1]);
        currentDecision = "";
        continue;
      }
      const decisionMatch = line.match(/^\s+decision:\s*(.+)$/);
      if (decisionMatch) {
        currentDecision = unquote(decisionMatch[1]);
      }
    }
    flush();
  }

  return evidence;
}

function validateVersionContract(skill) {
  const skillYamlPath = path.join(skill.dir, "skill.yaml");
  const changelogPath = path.join(skill.dir, "CHANGELOG.md");
  if (!fs.existsSync(skillYamlPath)) {
    return { file: repoFile(skill, "skill.yaml"), reason: "skill.yaml 不存在。" };
  }
  const skillYaml = fs.readFileSync(skillYamlPath, "utf8");
  const version = firstYamlValue(skillYaml, "version");
  if (!version) {
    return { file: repoFile(skill, "skill.yaml"), reason: "缺少 version 字段。" };
  }
  if (!skillYaml.includes(`${skill.id}@${version}`)) {
    return { file: repoFile(skill, "skill.yaml"), reason: "release tag 必须匹配当前 version。" };
  }
  if (!fs.existsSync(changelogPath)) {
    return { file: repoFile(skill, "CHANGELOG.md"), reason: "CHANGELOG.md 不存在。" };
  }
  const changelog = fs.readFileSync(changelogPath, "utf8");
  if (!new RegExp(`^##\\s+${escapeRegExp(version)}\\s+-\\s+`, "m").test(changelog)) {
    return { file: repoFile(skill, "CHANGELOG.md"), reason: `CHANGELOG.md 缺少当前版本 ${version}。` };
  }
  return null;
}

function extractLocalReferences(content) {
  const references = new Set();
  for (const match of content.matchAll(localPathPattern)) {
    references.add(normalizePath(match[1]));
  }
  return [...references];
}

function expandPatterns(patterns, files) {
  const expanded = new Set();
  for (const pattern of patterns) {
    const normalized = normalizePath(pattern);
    if (normalized.includes("*")) {
      for (const file of files) {
        if (matchesGlob(file, normalized)) {
          expanded.add(file);
        }
      }
    } else {
      expanded.add(normalized);
    }
  }
  return [...expanded].sort();
}

function matchesGlob(file, pattern) {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`).test(file);
}

function listSkillFiles(skillDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(normalizePath(path.relative(skillDir, fullPath)));
      }
    }
  };
  walk(skillDir);
  return files.sort();
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase());
}

function isIgnored(skillRelativeFile, config) {
  return config.ignoredFiles.some((pattern) => matchesGlob(skillRelativeFile, normalizePath(pattern)));
}

function repoFile(skill, skillRelativeFile) {
  return `${skill.relativeDir}/${normalizePath(skillRelativeFile)}`;
}

function loadSkills() {
  if (!fs.existsSync(skillsRoot)) {
    return [];
  }
  const skills = [];
  for (const domainEntry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!domainEntry.isDirectory()) {
      continue;
    }
    const domainDir = path.join(skillsRoot, domainEntry.name);
    for (const skillEntry of fs.readdirSync(domainDir, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) {
        continue;
      }
      const dir = path.join(domainDir, skillEntry.name);
      const yamlPath = path.join(dir, "skill.yaml");
      if (!fs.existsSync(yamlPath)) {
        continue;
      }
      const yaml = fs.readFileSync(yamlPath, "utf8");
      const id = firstYamlValue(yaml, "id");
      const domain = firstYamlValue(yaml, "domain");
      const version = firstYamlValue(yaml, "version");
      const status = firstYamlValue(yaml, "status");
      const entry = firstYamlValue(yaml, "entry");
      skills.push({
        id,
        domain,
        version,
        status,
        entry,
        dir,
        yamlPath,
        relativeDir: normalizePath(path.relative(repoRoot, dir))
      });
    }
  }
  return skills.sort((left, right) => left.id.localeCompare(right.id));
}

function resolveSkills(ids) {
  if (ids.length === 0) {
    return [];
  }
  const skills = loadSkills();
  return ids.map((id) => {
    const skill = skills.find((candidate) => candidate.id === id);
    if (!skill) {
      throw new Error(`未找到技能 "${id}"`);
    }
    return skill;
  });
}

function changedFiles(base) {
  return changedFileEntries(base).map((entry) => entry.file);
}

function changedFileEntries(base) {
  if (base) {
    return gitLines(["diff", "--name-status", base])
      .map(parseNameStatusEntry)
      .filter(Boolean)
      .flatMap(expandChangedEntry)
      .map(normalizeChangedEntry);
  }

  return gitLines(["status", "--porcelain=v1"])
    .map(parsePorcelainEntry)
    .filter(Boolean)
    .flatMap(expandChangedEntry)
    .map(normalizeChangedEntry);
}

function parseNameStatusEntry(line) {
  const parts = line.split(/\t+/);
  const status = parts[0] || "";
  const file = status.startsWith("R") || status.startsWith("C") ? parts[2] : parts[1];
  if (!file) {
    return null;
  }
  return {
    file,
    kind: statusToChangeKind(status)
  };
}

function parsePorcelainEntry(line) {
  const status = line.slice(0, 2);
  const trimmed = line.slice(3).trim();
  if (!trimmed) {
    return null;
  }
  const renameMatch = trimmed.match(/^(.+?)\s+->\s+(.+)$/);
  return {
    file: renameMatch ? renameMatch[2] : trimmed,
    kind: statusToChangeKind(status)
  };
}

function expandChangedEntry(entry) {
  if (shouldIgnoreChangedPath(entry.file)) {
    return [];
  }
  const absolutePath = path.join(repoRoot, entry.file);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    return [entry];
  }

  const files = [];
  const walk = (dir) => {
    for (const child of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, child.name);
      const repoRelative = path.relative(repoRoot, fullPath);
      if (shouldIgnoreChangedPath(repoRelative)) {
        continue;
      }
      if (child.isDirectory()) {
        walk(fullPath);
      } else if (child.isFile()) {
        files.push({
          file: repoRelative,
          kind: "added"
        });
      }
    }
  };
  walk(absolutePath);
  return files;
}

function shouldIgnoreChangedPath(repoRelativePath) {
  const normalized = normalizePath(repoRelativePath);
  const parts = normalized.split("/");
  if (parts.some((part) => changedIgnoredDirs.has(part))) {
    return true;
  }
  return changedIgnoredExtensions.has(path.extname(normalized).toLowerCase());
}

function normalizeChangedEntry(entry) {
  return {
    file: normalizePath(entry.file),
    kind: entry.kind
  };
}

function statusToChangeKind(status) {
  if (status === "??" || status.includes("A")) {
    return "added";
  }
  if (status.includes("D")) {
    return "deleted";
  }
  if (status.startsWith("R")) {
    return "renamed";
  }
  return "modified";
}

function parseOptions(rawArgs) {
  const flags = {};
  const positionals = [];

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const [name, inlineValue] = arg.replace(/^--/, "").split("=", 2);
    const next = rawArgs[i + 1];
    if (inlineValue !== undefined) {
      flags[toCamel(name)] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      flags[toCamel(name)] = next;
      i += 1;
    } else {
      flags[toCamel(name)] = true;
    }
  }

  return { flags, positionals };
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function firstYamlValue(content, key) {
  const match = content.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+?)\\s*$`, "m"));
  return match ? unquote(match[1]) : "";
}

function unquote(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function relative(targetPath) {
  return normalizePath(path.relative(repoRoot, targetPath));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function gitLines(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} 执行失败：${result.stderr || result.stdout}`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}
