#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const skillsRoot = path.join(repoRoot, "skills");
const templatesRoot = path.join(repoRoot, "templates", "skill");
const distRoot = path.join(repoRoot, "dist");
const installMarkerFile = ".nexgaios-skill-install.json";
const generatedFileNotice = "此文件由 `pnpm skills:docs` 生成。不要手动编辑。";
const maxGuardFileBytes = 5 * 1024 * 1024;

const command = process.argv[2] || "help";
const args = process.argv.slice(3);

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

async function main() {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      return printHelp();
    case "list":
      return listCommand(args);
    case "new":
      return newCommand(args);
    case "import":
      return importCommand(args);
    case "changed":
      return changedCommand(args);
    case "validate":
      return validateCommand(args);
    case "install":
      return installCommand(args);
    case "sync":
      return syncCommand(args);
    case "package":
      return packageCommand(args);
    case "ship":
      return shipCommand(args);
    case "docs":
      return docsCommand(args);
    case "guard":
      return guardCommand(args);
    case "pr-summary":
      return prSummaryCommand(args);
    case "release-notes":
      return releaseNotesCommand(args);
    case "version":
      return versionCommand(args);
    case "info":
      return infoCommand(args);
    case "version-changed":
      return versionChangedCommand(args);
    default:
      throw new Error(`未知命令 "${command}"。请运行 "pnpm skill:list" 或 "node tools/skills/skill-cli.mjs help"。`);
  }
}

function printHelp() {
  console.log(`nexgaios 技能命令行工具

命令：
  list [--write-catalog]
  new <domain> <skill-id>
  import <domain> <skill-id> --from <path-or-git-url> [--ref <tag-or-branch>] [--version <semver>] [--force]
  changed [--base <git-range-or-ref>]
  validate <skill-id>|--all
  install <skill-id>|--all [--target <path>] [--prune]
  sync [--target <path>] [--prune]
  package <skill-id> [--print-path]
  ship <skill-id> [--patch|--minor|--major|--no-release] [-m <message>]
  docs [--check]
  guard [--base <git-range-or-ref>|--all]
  pr-summary [--base <git-range-or-ref>]
  release-notes <skill-id> [--base <git-range-or-ref>]
  version <skill-id>
  info <skill-id> [--field id|domain|version|path|entry]
  version-changed <skill-id> --base <git-ref>
`);
}

function parseOptions(rawArgs) {
  const flags = {};
  const positionals = [];

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (!arg.startsWith("-")) {
      positionals.push(arg);
      continue;
    }

    if (arg === "-m") {
      flags.message = rawArgs[++i] || "";
      continue;
    }

    const [name, inlineValue] = arg.replace(/^--/, "").split("=", 2);
    const next = rawArgs[i + 1];
    if (inlineValue !== undefined) {
      flags[toCamel(name)] = inlineValue;
    } else if (next && !next.startsWith("-")) {
      flags[toCamel(name)] = next;
      i += 1;
    } else {
      flags[toCamel(name)] = true;
    }
  }

  return { flags, positionals };
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function listCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  const skills = loadSkills();

  if (flags.writeCatalog) {
    writeCatalog(skills);
  }

  if (skills.length === 0) {
    console.log("没有找到技能。");
    return;
  }

  for (const skill of skills) {
    console.log(`${skill.id}\t${skill.domain}\t${skill.version}\t${relative(skill.dir)}`);
  }
}

function newCommand(rawArgs) {
  const { positionals } = parseOptions(rawArgs);
  const [domain, skillId] = positionals;

  assertSlug(domain, "domain");
  assertSlug(skillId, "skill-id");

  const targetDir = path.join(skillsRoot, domain, skillId);
  if (fs.existsSync(targetDir)) {
    throw new Error(`技能已存在：${relative(targetDir)}`);
  }

  const replacements = {
    "{{domain}}": domain,
    "{{skill_id}}": skillId,
    "{{title}}": titleize(skillId),
    "{{date}}": today()
  };

  copyTemplateDir(templatesRoot, targetDir, replacements);
  fs.mkdirSync(path.join(targetDir, "references"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "tests"), { recursive: true });

  writeCatalog(loadSkills());
  console.log(`已创建 ${relative(targetDir)}`);
}

function importCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const [domain, skillId] = positionals;

  assertSlug(domain, "domain");
  assertSlug(skillId, "skill-id");

  if (!flags.from) {
    throw new Error("缺少 --from 参数，请提供本地目录或 GitHub 仓库 URL");
  }

  const targetDir = path.join(skillsRoot, domain, skillId);
  assertPathInside(targetDir, skillsRoot);
  if (fs.existsSync(targetDir) && !flags.force) {
    throw new Error(`技能已存在：${relative(targetDir)}。如需覆盖导入，请追加 --force`);
  }

  const source = prepareImportSource(String(flags.from), flags.ref ? String(flags.ref) : "");

  try {
    assertImportSourceTargetSafe(source.dir, targetDir);

    if (!fs.existsSync(path.join(source.dir, "SKILL.md"))) {
      throw new Error(`导入源缺少 SKILL.md：${source.display}`);
    }

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });
    copyDir(source.dir, targetDir, shouldCopyImportFile);

    const version = resolveImportVersion(targetDir, source, flags.version ? String(flags.version) : "");
    writeImportedSkillYaml(targetDir, {
      id: skillId,
      domain,
      version,
      source,
      validateCommand: inferValidateCommand(targetDir)
    });
    ensureImportedReadme(targetDir, { id: skillId, domain, version, source });
    ensureImportedChangelog(targetDir, { id: skillId, version, source });

    writeCatalog(loadSkills());
    validateSkill(findSkill(skillId));
    console.log(`已导入 ${skillId} 到 ${relative(targetDir)}`);
  } finally {
    cleanupImportSource(source);
  }
}

function changedCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  const changedSkills = getChangedSkills(flags.base);
  for (const skill of changedSkills) {
    console.log(skill.id);
  }
}

function validateCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const skills = flags.all ? loadSkills() : resolveSkills(positionals);

  if (skills.length === 0) {
    console.log("没有需要验证的技能。");
    return;
  }

  for (const skill of skills) {
    validateSkill(skill);
    const validateCommand = skill.validate?.command;
    if (validateCommand) {
      runShell(validateCommand, { cwd: skill.dir });
    }
    console.log(`已验证 ${skill.id}`);
  }
}

function installCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const [skillId] = positionals;
  const targetRoot = path.resolve(flags.target || path.join(os.homedir(), ".codex", "skills"));

  if (flags.all) {
    installSkills(activeSkills(loadSkills()), targetRoot, { prune: Boolean(flags.prune) });
    return;
  }

  const skill = findSkill(skillId);
  installOneSkill(skill, targetRoot);
}

function syncCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  const targetRoot = path.resolve(flags.target || path.join(os.homedir(), ".codex", "skills"));
  installSkills(activeSkills(loadSkills()), targetRoot, { prune: Boolean(flags.prune) });
}

function packageCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const [skillId] = positionals;
  const skill = findSkill(skillId);
  validateSkill(skill);

  if (skill.package?.command) {
    runShell(skill.package.command, { cwd: skill.dir });
    return;
  }

  fs.mkdirSync(distRoot, { recursive: true });
  const outputPath = path.join(distRoot, `${skill.id}-${skill.version}.tgz`);
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath);
  }

  run("tar", [
    "-czf",
    outputPath,
    "--exclude", "node_modules",
    "--exclude", "__pycache__",
    "--exclude", ".pytest_cache",
    "--exclude", ".mypy_cache",
    "--exclude", "artifacts",
    "--exclude", "data",
    "--exclude", ".env",
    "--exclude", "*.pyc",
    "-C",
    skill.dir,
    "."
  ], { cwd: repoRoot });

  if (flags.printPath) {
    console.log(outputPath);
  } else {
    console.log(`已打包 ${skill.id} 到 ${outputPath}`);
  }
}

function shipCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const [skillId] = positionals;
  const skill = findSkill(skillId);
  const releaseMode = getReleaseMode(flags);
  const message = flags.message || defaultCommitMessage(skill, releaseMode);

  ensureGitRepo();
  ensureNoConflictingReleaseFlags(flags);

  if (releaseMode !== "no-release") {
    const nextVersion = bumpVersion(skill.version, releaseMode);
    updateSkillYamlVersion(skill, nextVersion);
    updateChangelog(skill, nextVersion, message);
    writeCatalog(loadSkills());
    skill.version = nextVersion;
  }

  validateSkill(skill);
  if (skill.validate?.command) {
    runShell(skill.validate.command, { cwd: skill.dir });
  }

  ensureWorktreeHasSkillChanges(skill);
  ensureBranch(skill.id);
  run("git", ["add", relative(skill.dir), "catalog.yaml"], { cwd: repoRoot });
  run("git", ["commit", "-m", message], { cwd: repoRoot });
  const branch = currentBranch();
  run("git", ["push", "-u", "origin", branch], { cwd: repoRoot });
  maybeCreatePullRequest(message, branch);
}

function versionCommand(rawArgs) {
  const { positionals } = parseOptions(rawArgs);
  console.log(findSkill(positionals[0]).version);
}

function infoCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const skill = findSkill(positionals[0]);
  const info = {
    id: skill.id,
    domain: skill.domain,
    version: skill.version,
    path: relative(skill.dir),
    entry: relative(path.join(skill.dir, skill.entry))
  };

  if (flags.field) {
    if (!(flags.field in info)) {
      throw new Error(`未知信息字段 "${flags.field}"`);
    }
    console.log(info[flags.field]);
  } else {
    console.log(JSON.stringify(info, null, 2));
  }
}

function versionChangedCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const skill = findSkill(positionals[0]);
  const base = flags.base;
  if (!base) {
    throw new Error("缺少 --base 参数");
  }

  const oldVersion = readSkillVersionAtRef(skill, base);
  if (oldVersion !== skill.version) {
    console.log(`${skill.id}: ${oldVersion || "(新建)"} -> ${skill.version}`);
    return;
  }

  process.exitCode = 1;
}

function docsCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  const docs = generateDocsFiles(loadSkills());

  if (flags.check) {
    const outdated = [];
    for (const [filePath, content] of docs.entries()) {
      const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
      if (normalizeNewlines(current) !== normalizeNewlines(content)) {
        outdated.push(relative(filePath));
      }
    }

    if (outdated.length > 0) {
      throw new Error(`生成文档未更新：${outdated.join(", ")}。请运行 pnpm skills:docs`);
    }

    console.log("生成文档已是最新。");
    return;
  }

  for (const [filePath, content] of docs.entries()) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  console.log("已生成技能总览和业务域 README。");
}

function guardCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  const files = guardFileList(flags);
  const violations = collectGuardViolations(files);

  if (violations.length > 0) {
    const detail = violations.map((violation) => `- ${violation.file}: ${violation.reason}`).join("\n");
    throw new Error(`防误传检查失败：\n${detail}`);
  }

  console.log(`防误传检查通过，共检查 ${files.length} 个文件。`);
}

function prSummaryCommand(rawArgs) {
  const { flags } = parseOptions(rawArgs);
  console.log(generatePrSummary(flags.base || ""));
}

function releaseNotesCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const skill = findSkill(positionals[0]);
  console.log(generateReleaseNotes(skill, flags.base || ""));
}

function loadSkills() {
  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  const skills = [];
  const domains = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const domain of domains) {
    const domainDir = path.join(skillsRoot, domain);
    const skillDirs = fs.readdirSync(domainDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const skillDirName of skillDirs) {
      const skillDir = path.join(domainDir, skillDirName);
      const yamlPath = path.join(skillDir, "skill.yaml");
      if (!fs.existsSync(yamlPath)) {
        continue;
      }

      const data = parseYamlLoose(fs.readFileSync(yamlPath, "utf8"));
      skills.push({
        ...data,
        dir: skillDir,
        yamlPath,
        relativeDir: relative(skillDir)
      });
    }
  }

  return skills.sort((left, right) => left.id.localeCompare(right.id));
}

function resolveSkills(ids) {
  if (ids.length === 0) {
    return getChangedSkills();
  }
  return ids.map(findSkill);
}

function findSkill(skillId) {
  if (!skillId) {
    throw new Error("缺少技能 id");
  }

  const skill = loadSkills().find((candidate) => candidate.id === skillId);
  if (!skill) {
    throw new Error(`未找到技能 "${skillId}"`);
  }
  return skill;
}

function validateSkill(skill) {
  const missing = ["id", "domain", "version", "entry", "status"].filter((field) => !skill[field]);
  if (missing.length > 0) {
    throw new Error(`${skill.relativeDir}/skill.yaml 缺少字段：${missing.join(", ")}`);
  }

  assertSlug(skill.id, "id");
  assertSlug(skill.domain, "domain");

  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(skill.version)) {
    throw new Error(`${skill.id} 的 semver 版本号无效："${skill.version}"`);
  }

  const expectedDir = path.join(skillsRoot, skill.domain, skill.id);
  if (path.resolve(skill.dir) !== path.resolve(expectedDir)) {
    throw new Error(`${skill.id} 必须位于 ${relative(expectedDir)}`);
  }

  const entryPath = path.join(skill.dir, skill.entry);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`${skill.id} 的入口文件不存在：${relative(entryPath)}`);
  }
}

function activeSkills(skills) {
  return skills.filter((skill) => skill.status === "active");
}

function installSkills(skills, targetRoot, options = {}) {
  if (skills.length === 0) {
    console.log("没有可安装的 active 技能。");
    return;
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  for (const skill of skills) {
    installOneSkill(skill, targetRoot);
  }

  if (options.prune) {
    pruneInstalledSkills(targetRoot, skills);
  }

  console.log(`已同步 ${skills.length} 个技能到 ${targetRoot}`);
}

function installOneSkill(skill, targetRoot) {
  validateSkill(skill);

  const resolvedTargetRoot = path.resolve(targetRoot);
  const targetDir = path.join(resolvedTargetRoot, skill.id);
  assertPathInside(targetDir, resolvedTargetRoot);

  fs.mkdirSync(resolvedTargetRoot, { recursive: true });
  fs.rmSync(targetDir, { recursive: true, force: true });
  copyDir(skill.dir, targetDir, shouldCopySkillFile);
  writeInstallMarker(skill, targetDir);
  console.log(`已安装 ${skill.id}@${skill.version} 到 ${targetDir}`);
}

function writeInstallMarker(skill, targetDir) {
  const marker = {
    manager: "nexgaios-skills",
    repository: repositoryIdentity(),
    skillId: skill.id,
    domain: skill.domain,
    version: skill.version,
    sourcePath: relative(skill.dir).replaceAll("\\", "/"),
    installedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(targetDir, installMarkerFile), `${JSON.stringify(marker, null, 2)}\n`);
}

function pruneInstalledSkills(targetRoot, currentSkills) {
  const currentIds = new Set(currentSkills.map((skill) => skill.id));
  const repoIdentity = repositoryIdentity();
  let removed = 0;

  for (const entry of fs.readdirSync(targetRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDir = path.join(targetRoot, entry.name);
    const markerPath = path.join(skillDir, installMarkerFile);
    if (!fs.existsSync(markerPath)) {
      continue;
    }

    let marker;
    try {
      marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
    } catch {
      continue;
    }

    if (marker.manager !== "nexgaios-skills" || marker.repository !== repoIdentity) {
      continue;
    }

    if (!currentIds.has(marker.skillId)) {
      assertPathInside(skillDir, targetRoot);
      fs.rmSync(skillDir, { recursive: true, force: true });
      removed += 1;
      console.log(`已删除本仓库不再管理的安装目录：${skillDir}`);
    }
  }

  if (removed === 0) {
    console.log("没有需要删除的旧安装目录。");
  }
}

function parseYamlLoose(content) {
  const result = {};
  let currentObject = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }

    const indent = line.match(/^\s*/)[0].length;
    const match = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = unquote(rawValue.trim());

    if (indent === 0) {
      if (value === "") {
        result[key] = {};
        currentObject = key;
      } else {
        result[key] = value;
        currentObject = null;
      }
      continue;
    }

    if (currentObject) {
      result[currentObject][key] = value;
    }
  }

  return result;
}

function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}

function writeCatalog(skills) {
  const lines = [
    "# 此文件由 `pnpm skill:list --write-catalog` 生成。",
    "skills:"
  ];

  if (skills.length === 0) {
    lines[1] = "skills: []";
  } else {
    for (const skill of skills) {
      lines.push(`  - id: ${skill.id}`);
      lines.push(`    domain: ${skill.domain}`);
      lines.push(`    version: ${skill.version}`);
      lines.push(`    path: ${relative(skill.dir).replaceAll("\\", "/")}`);
      lines.push(`    status: ${skill.status}`);
    }
  }

  fs.writeFileSync(path.join(repoRoot, "catalog.yaml"), `${lines.join("\n")}\n`);
}

function generateDocsFiles(skills) {
  const docs = new Map();
  const sortedSkills = [...skills].sort((left, right) => {
    const domainCompare = left.domain.localeCompare(right.domain);
    if (domainCompare !== 0) {
      return domainCompare;
    }
    return left.id.localeCompare(right.id);
  });

  docs.set(path.join(repoRoot, "docs", "skills-overview.md"), renderSkillsOverview(sortedSkills));

  const domains = [...new Set(sortedSkills.map((skill) => skill.domain))].sort();
  for (const domain of domains) {
    const domainSkills = sortedSkills.filter((skill) => skill.domain === domain);
    docs.set(path.join(skillsRoot, domain, "README.md"), renderDomainReadme(domain, domainSkills));
  }

  return docs;
}

function renderSkillsOverview(skills) {
  const domains = [...new Set(skills.map((skill) => skill.domain))].sort();
  const lines = [
    "# 技能总览",
    "",
    `> ${generatedFileNotice}`,
    "",
    "## 统计",
    "",
    `- 技能数量：${skills.length}`,
    `- 业务域数量：${domains.length}`,
    "",
    "## 技能列表",
    "",
    "| 技能 | 业务域 | 版本 | 状态 | 路径 | 来源 |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const skill of skills) {
    lines.push([
      markdownLink(skill.id, path.join("..", skill.relativeDir, "README.md")),
      markdownEscape(skill.domain),
      markdownEscape(skill.version),
      markdownEscape(skill.status),
      markdownCode(skill.relativeDir.replaceAll("\\", "/")),
      markdownEscape(sourceSummary(skill))
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push(
    "",
    "## 业务域",
    "",
    "| 业务域 | 技能数量 | 目录 |",
    "| --- | ---: | --- |"
  );

  for (const domain of domains) {
    const count = skills.filter((skill) => skill.domain === domain).length;
    lines.push(`| ${markdownEscape(domain)} | ${count} | ${markdownLink(`skills/${domain}`, path.join("..", "skills", domain, "README.md"))} |`);
  }

  lines.push(
    "",
    "## 常用命令",
    "",
    "```powershell",
    "pnpm skill:sync",
    "pnpm skills:docs",
    "pnpm skills:guard",
    "pnpm skills:validate",
    "```",
    ""
  );

  return `${lines.join("\n")}`;
}

function renderDomainReadme(domain, skills) {
  const lines = [
    `# ${domain} 技能`,
    "",
    `> ${generatedFileNotice}`,
    "",
    `该业务域当前包含 ${skills.length} 个 active skill。`,
    "",
    "| 技能 | 版本 | 状态 | 说明 |",
    "| --- | --- | --- | --- |"
  ];

  for (const skill of skills) {
    lines.push([
      markdownLink(skill.id, path.join(skill.id, "README.md")),
      markdownEscape(skill.version),
      markdownEscape(skill.status),
      markdownEscape(skillDescription(skill))
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push(
    "",
    "## 业务域命令",
    "",
    "```powershell",
    "pnpm skill:sync",
    "pnpm skills:validate",
    "```",
    ""
  );

  return lines.join("\n");
}

function skillDescription(skill) {
  const entryPath = path.join(skill.dir, skill.entry);
  if (!fs.existsSync(entryPath)) {
    return "";
  }

  const content = fs.readFileSync(entryPath, "utf8");
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatter) {
    const description = frontmatter[1].split(/\r?\n/)
      .map((line) => line.match(/^description:\s*(.*)$/)?.[1])
      .find(Boolean);
    if (description) {
      return unquote(description.trim());
    }
  }

  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const paragraph = body.split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#"));
  return paragraph ? paragraph.replace(/\s+/g, " ") : "";
}

function sourceSummary(skill) {
  if (skill.source?.repository) {
    const ref = skill.source.ref || skill.source.tag || "";
    return ref ? `${skill.source.repository} (${ref})` : skill.source.repository;
  }
  if (skill.source?.path) {
    return skill.source.path;
  }
  return "未记录";
}

function getChangedSkills(base) {
  const skills = loadSkills();
  const files = changedFiles(base);

  if (files.some(isSharedToolingPath)) {
    return skills;
  }

  const changedSkillIds = new Set();
  for (const file of files) {
    const normalized = file.replaceAll("\\", "/");
    const match = normalized.match(/^skills\/([^/]+)\/([^/]+)\//);
    if (match) {
      const skill = skills.find((candidate) => candidate.domain === match[1] && candidate.id === match[2]);
      if (skill) {
        changedSkillIds.add(skill.id);
      }
    }
  }

  return skills.filter((skill) => changedSkillIds.has(skill.id));
}

function changedFileGroups(base) {
  const skills = loadSkills();
  const files = changedFiles(base);
  const skillFiles = new Map();
  const sharedFiles = [];
  const otherFiles = [];

  for (const file of files) {
    const normalized = file.replaceAll("\\", "/");
    const match = normalized.match(/^skills\/([^/]+)\/([^/]+)\//);
    if (match) {
      const skill = skills.find((candidate) => candidate.domain === match[1] && candidate.id === match[2]);
      if (skill) {
        if (!skillFiles.has(skill.id)) {
          skillFiles.set(skill.id, []);
        }
        skillFiles.get(skill.id).push(normalized);
        continue;
      }
    }

    if (isSharedToolingPath(normalized)) {
      sharedFiles.push(normalized);
    } else {
      otherFiles.push(normalized);
    }
  }

  return { skills, files, skillFiles, sharedFiles, otherFiles };
}

function generatePrSummary(base) {
  const groups = changedFileGroups(base);
  const baseRef = baseRefFromRange(base);
  const lines = [
    "<!-- nexgaios-skills-pr-summary -->",
    "## 技能变更说明",
    "",
    `基准：${base ? markdownCode(base) : "当前工作区变更"}`,
    "",
    "### 变更的技能",
    ""
  ];

  if (groups.skillFiles.size === 0) {
    lines.push("没有直接修改任何 skill 目录。");
  } else {
    lines.push(
      "| 技能 | 业务域 | 版本变化 | 发布判断 | 变更文件数 |",
      "| --- | --- | --- | --- | ---: |"
    );

    for (const [skillId, files] of [...groups.skillFiles.entries()].sort()) {
      const skill = groups.skills.find((candidate) => candidate.id === skillId);
      const oldVersion = baseRef ? readSkillVersionAtRef(skill, baseRef) : null;
      const versionText = oldVersion ? `${oldVersion} -> ${skill.version}` : `(新建) -> ${skill.version}`;
      const releaseText = oldVersion !== skill.version
        ? "合并到 main 后会发布"
        : "版本号未变化，不会发布";
      lines.push(`| ${markdownEscape(skill.id)} | ${markdownEscape(skill.domain)} | ${markdownEscape(versionText)} | ${releaseText} | ${files.length} |`);
    }
  }

  lines.push(
    "",
    "### 共享文件变更",
    ""
  );

  if (groups.sharedFiles.length === 0) {
    lines.push("没有修改共享工具、模板、CI 或目录索引。");
  } else {
    lines.push(...groups.sharedFiles.slice(0, 30).map((file) => `- ${markdownCode(file)}`));
    if (groups.sharedFiles.length > 30) {
      lines.push(`- 另有 ${groups.sharedFiles.length - 30} 个共享文件未列出。`);
    }
  }

  if (groups.otherFiles.length > 0) {
    lines.push(
      "",
      "### 其他文件变更",
      "",
      ...groups.otherFiles.slice(0, 30).map((file) => `- ${markdownCode(file)}`)
    );
    if (groups.otherFiles.length > 30) {
      lines.push(`- 另有 ${groups.otherFiles.length - 30} 个其他文件未列出。`);
    }
  }

  lines.push(
    "",
    "发布规则：只有某个 skill 的 `skill.yaml` 版本号发生变化，main 分支发布 workflow 才会为该 skill 创建 GitHub Release。",
    ""
  );

  return lines.join("\n");
}

function generateReleaseNotes(skill, base) {
  const baseRef = baseRefFromRange(base);
  const files = changedFiles(base)
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => file.startsWith(`${skill.relativeDir.replaceAll("\\", "/")}/`));
  const oldVersion = baseRef ? readSkillVersionAtRef(skill, baseRef) : null;

  const lines = [
    `## ${skill.id} ${skill.version}`,
    "",
    "### 技能信息",
    "",
    `- 技能：${skill.id}`,
    `- 业务域：${skill.domain}`,
    `- 版本：${oldVersion && oldVersion !== skill.version ? `${oldVersion} -> ${skill.version}` : skill.version}`,
    `- 仓库路径：${skill.relativeDir.replaceAll("\\", "/")}`,
    "",
    "### 安装方式",
    "",
    "```powershell",
    `pnpm skill:install ${skill.id}`,
    "pnpm skill:sync",
    "```",
    "",
    "### 本次变更文件",
    ""
  ];

  if (files.length === 0) {
    lines.push("- 未从当前 Git diff 中识别到该 skill 的文件变更。");
  } else {
    lines.push(...files.slice(0, 50).map((file) => `- ${markdownCode(file)}`));
    if (files.length > 50) {
      lines.push(`- 另有 ${files.length - 50} 个文件未列出。`);
    }
  }

  lines.push(
    "",
    "### 更新日志",
    "",
    latestChangelogEntry(skill),
    ""
  );

  return lines.join("\n");
}

function latestChangelogEntry(skill) {
  const changelogPath = path.join(skill.dir, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    return `未找到 ${skill.id} 的 CHANGELOG.md。`;
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  const escapedVersion = skill.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`(?:^|\\n)##\\s+v?${escapedVersion}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+|\\s*$)`));
  if (!match) {
    return `CHANGELOG.md 中未找到 ${skill.version} 对应条目。`;
  }

  return match[1].trim() || `CHANGELOG.md 中 ${skill.version} 条目为空。`;
}

function baseRefFromRange(base) {
  if (!base) {
    return "";
  }
  if (hasZeroSha(base)) {
    return "";
  }
  if (base.includes("...")) {
    return base.split("...", 1)[0];
  }
  if (base.includes("..")) {
    return base.split("..", 1)[0];
  }
  return base;
}

function changedFiles(base) {
  ensureGitRepo();

  if (base) {
    if (hasZeroSha(base)) {
      return gitLines(["ls-files"]);
    }
    return gitLines(["diff", "--name-only", base]);
  }

  const statusFiles = run("git", ["status", "--porcelain=v1"], { cwd: repoRoot, capture: true })
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map(parsePorcelainPath)
    .filter(Boolean)
    .map((line) => line.replace(/^"|"$/g, ""));

  if (statusFiles.length > 0) {
    return statusFiles;
  }

  if (runQuiet("git", ["rev-parse", "--verify", "origin/main"], { cwd: repoRoot })) {
    return gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  }

  if (runQuiet("git", ["rev-parse", "--verify", "HEAD~1"], { cwd: repoRoot })) {
    return gitLines(["diff", "--name-only", "HEAD~1...HEAD"]);
  }

  return [];
}

function parsePorcelainPath(line) {
  let file = line.slice(3).trim();
  if (file.includes(" -> ")) {
    file = file.split(" -> ").pop().trim();
  }
  return file;
}

function guardFileList(flags) {
  ensureGitRepo();

  if (flags.base) {
    return changedFiles(String(flags.base));
  }

  if (flags.all) {
    return gitLines(["ls-files"]);
  }

  const tracked = gitLines(["ls-files", "--cached"]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set([...tracked, ...untracked])].sort();
}

function collectGuardViolations(files) {
  const violations = [];

  for (const file of files) {
    const normalized = file.replaceAll("\\", "/");
    const absolutePath = path.join(repoRoot, normalized);

    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      continue;
    }

    const pathReason = forbiddenPathReason(normalized);
    if (pathReason) {
      violations.push({ file: normalized, reason: pathReason });
      continue;
    }

    const size = fs.statSync(absolutePath).size;
    if (size > maxGuardFileBytes) {
      violations.push({ file: normalized, reason: `文件大小超过 ${Math.round(maxGuardFileBytes / 1024 / 1024)} MiB` });
      continue;
    }

    const secretReason = secretContentReason(absolutePath);
    if (secretReason) {
      violations.push({ file: normalized, reason: secretReason });
    }
  }

  return violations;
}

function forbiddenPathReason(file) {
  const lower = file.toLowerCase();
  const parts = lower.split("/");
  const name = parts[parts.length - 1];
  const extension = path.posix.extname(lower);

  if (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) {
    return "禁止提交本地环境变量文件；只允许提交 .env.example";
  }

  const forbiddenDirs = new Set([
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    "node_modules",
    "dist",
    "artifacts",
    "data",
    "outputs",
    "reports",
    "screenshots",
    "tmp",
    "temp"
  ]);

  const forbiddenDir = parts.find((part) => forbiddenDirs.has(part));
  if (forbiddenDir) {
    return `禁止提交 ${forbiddenDir}/ 目录中的临时或生成文件`;
  }

  if ([".pyc", ".pyo", ".log"].includes(extension)) {
    return `禁止提交 ${extension} 临时文件`;
  }

  const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension);
  const isAsset = parts.includes("assets");
  if (isImage && !isAsset && /(screenshot|screen-shot|html-qa|qa-|截屏|截图)/i.test(name)) {
    return "禁止提交临时截图；需要长期复用的图片请放入 assets/ 并使用明确命名";
  }

  if (extension === ".html" && !isAsset && /(report|audit|export|qa|审计|报告)/i.test(name)) {
    return "禁止提交临时 HTML 报告；报告产物应放在本地 artifacts/ 或 outputs/ 中";
  }

  return "";
}

function secretContentReason(absolutePath) {
  if (isProbablyBinary(absolutePath)) {
    return "";
  }

  const size = fs.statSync(absolutePath).size;
  if (size > 1024 * 1024) {
    return "";
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const checks = [
    { label: "GitHub classic token", pattern: /\bghp_[A-Za-z0-9]{20,}\b/ },
    { label: "GitHub fine-grained token", pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
    { label: "OpenAI API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
    { label: "private key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
    { label: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ }
  ];

  const matched = checks.find((check) => check.pattern.test(content));
  return matched ? `疑似包含 ${matched.label}` : "";
}

function isProbablyBinary(absolutePath) {
  const buffer = fs.readFileSync(absolutePath);
  const length = Math.min(buffer.length, 8000);
  for (let i = 0; i < length; i += 1) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

function hasZeroSha(value) {
  return /(^|[.\s])0{40}($|[.\s])/.test(value);
}

function isSharedToolingPath(file) {
  const normalized = file.replaceAll("\\", "/");
  return normalized === "catalog.yaml"
    || normalized === "package.json"
    || normalized === "pnpm-lock.yaml"
    || normalized === "pnpm-workspace.yaml"
    || normalized === ".gitignore"
    || normalized === ".gitattributes"
    || normalized === "README.md"
    || normalized === "skill.cmd"
    || normalized === "skill.ps1"
    || normalized.startsWith("tools/")
    || normalized.startsWith("templates/")
    || normalized.startsWith(".github/workflows/")
    || normalized.startsWith("docs/")
    || /^skills\/[^/]+\/README\.md$/.test(normalized);
}

function readSkillVersionAtRef(skill, ref) {
  const gitPath = relative(skill.yamlPath).replaceAll("\\", "/");
  const result = spawnSync("git", ["show", `${ref}:${gitPath}`], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return null;
  }

  return parseYamlLoose(result.stdout).version || null;
}

function getReleaseMode(flags) {
  if (flags.noRelease) {
    return "no-release";
  }
  if (flags.major) {
    return "major";
  }
  if (flags.minor) {
    return "minor";
  }
  return "patch";
}

function ensureNoConflictingReleaseFlags(flags) {
  const selected = ["patch", "minor", "major", "noRelease"].filter((flag) => flags[flag]);
  if (selected.length > 1) {
    throw new Error("只能使用一个发布参数：--patch、--minor、--major 或 --no-release");
  }
}

function bumpVersion(version, mode) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`无法提升无效版本号 "${version}"`);
  }

  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);

  if (mode === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (mode === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function updateSkillYamlVersion(skill, nextVersion) {
  let content = fs.readFileSync(skill.yamlPath, "utf8");
  content = content.replace(/^version:\s*.+$/m, `version: ${nextVersion}`);
  content = content.replace(/^(\s*tag:\s*)[^@\s]+@.+$/m, `$1${skill.id}@${nextVersion}`);
  fs.writeFileSync(skill.yamlPath, content);
}

function updateChangelog(skill, nextVersion, message) {
  const changelogPath = path.join(skill.dir, "CHANGELOG.md");
  const entry = `## ${nextVersion} - ${today()}\n\n- ${message}\n\n`;

  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, `# 更新日志\n\n${entry}`);
    return;
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  const updated = content
    .replace(/^# 更新日志\s*/m, `# 更新日志\n\n${entry}`)
    .replace(/^# Changelog\s*/m, `# 更新日志\n\n${entry}`);
  fs.writeFileSync(changelogPath, updated);
}

function ensureWorktreeHasSkillChanges(skill) {
  const files = changedFiles();
  const prefix = relative(skill.dir).replaceAll("\\", "/");
  const hasSkillChanges = files.some((file) => file.replaceAll("\\", "/").startsWith(prefix));
  if (!hasSkillChanges) {
    throw new Error(`在 ${prefix} 下没有发现变更`);
  }
}

function ensureBranch(skillId) {
  const branch = currentBranch();
  if (branch !== "main" && branch !== "master") {
    return;
  }

  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "")
    .replace("T", "-");
  run("git", ["checkout", "-b", `skill/${skillId}-${timestamp}`], { cwd: repoRoot });
}

function maybeCreatePullRequest(message, branch) {
  const gh = findGhExecutable();
  if (!gh) {
    console.log("未找到 GitHub CLI。分支已推送，请手动从该分支创建 PR。");
    return;
  }

  if (!runQuiet(gh, ["auth", "status"], { cwd: repoRoot })) {
    console.log(`GitHub CLI 已安装，但尚未登录。请先运行 \`gh auth login\`，然后用这个命令创建 PR：gh pr create --fill --title "${message}" --head ${branch}`);
    return;
  }

  const result = spawnSync(gh, ["pr", "create", "--fill", "--title", message, "--head", branch], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.log("分支已推送，但 PR 没有创建完成。你可以在 GitHub 上手动打开。");
  }
}

function findGhExecutable() {
  if (runQuiet("gh", ["--version"], { cwd: repoRoot })) {
    return "gh";
  }

  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\GitHub CLI\\gh.exe",
      path.join(process.env.LOCALAPPDATA || "", "Programs", "GitHub CLI", "gh.exe")
    ];

    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function currentBranch() {
  return run("git", ["branch", "--show-current"], { cwd: repoRoot, capture: true }).trim();
}

function defaultCommitMessage(skill, releaseMode) {
  if (releaseMode === "no-release") {
    return `chore(${skill.id}): 更新技能`;
  }
  return `release(${skill.id}): 发布 ${releaseMode} 版本`;
}

function assertSlug(value, label) {
  if (!value || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error(`${label} 必须是小写 kebab-case`);
  }
}

function titleize(value) {
  return value.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function prepareImportSource(sourceValue, refValue) {
  const parsed = parseImportSource(sourceValue);
  if (parsed.kind === "git") {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nexgaios-skill-import-"));
    const cloneArgs = ["clone", "--depth", "1"];
    if (refValue || parsed.ref) {
      cloneArgs.push("--branch", refValue || parsed.ref);
    }
    cloneArgs.push(parsed.url, tempRoot);
    run("git", cloneArgs, { cwd: repoRoot });

    const commit = run("git", ["rev-parse", "HEAD"], { cwd: tempRoot, capture: true }).trim();
    return {
      kind: "git",
      dir: tempRoot,
      display: parsed.url,
      repository: parsed.url.replace(/\.git$/, ""),
      ref: refValue || parsed.ref || "",
      commit,
      cleanupDir: tempRoot
    };
  }

  const localPath = path.resolve(sourceValue);
  if (!fs.existsSync(localPath)) {
    throw new Error(`导入源不存在：${localPath}`);
  }
  if (!fs.statSync(localPath).isDirectory()) {
    throw new Error(`导入源必须是目录：${localPath}`);
  }

  const source = {
    kind: "path",
    dir: localPath,
    display: localPath,
    path: localPath,
    ref: refValue || "",
    commit: ""
  };

  if (runQuiet("git", ["rev-parse", "--show-toplevel"], { cwd: localPath })) {
    source.commit = run("git", ["rev-parse", "HEAD"], { cwd: localPath, capture: true }).trim();
    const remote = spawnSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: localPath,
      encoding: "utf8",
      stdio: "pipe",
      shell: false
    });
    source.repository = remote.status === 0 ? remote.stdout.trim().replace(/\.git$/, "") : "";
  }

  return source;
}

function parseImportSource(sourceValue) {
  const trimmed = sourceValue.trim();
  const githubMatch = trimmed.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+)(?:\/(?:tree|releases\/tag)\/([^?\s#]+)|\/tags)?\/?$/);
  if (githubMatch) {
    const owner = githubMatch[1];
    const repo = githubMatch[2].replace(/\.git$/, "");
    return {
      kind: "git",
      url: `https://github.com/${owner}/${repo}.git`,
      ref: githubMatch[3] ? decodeURIComponent(githubMatch[3]) : ""
    };
  }

  if (/^https?:\/\/.+\.git$/i.test(trimmed) || /^git@.+:.+\.git$/i.test(trimmed)) {
    return { kind: "git", url: trimmed, ref: "" };
  }

  return { kind: "path" };
}

function cleanupImportSource(source) {
  if (!source.cleanupDir) {
    return;
  }
  const resolved = path.resolve(source.cleanupDir);
  if (!resolved.startsWith(os.tmpdir())) {
    throw new Error(`拒绝清理非临时导入目录：${resolved}`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function resolveImportVersion(targetDir, source, explicitVersion) {
  const candidates = [
    explicitVersion,
    readVersionFromSkillYaml(targetDir),
    readVersionFromPackageJson(targetDir),
    normalizeSemver(source.ref || "")
  ].filter(Boolean);

  return candidates[0] || "0.1.0";
}

function readVersionFromSkillYaml(skillDir) {
  const yamlPath = path.join(skillDir, "skill.yaml");
  if (!fs.existsSync(yamlPath)) {
    return "";
  }
  const data = parseYamlLoose(fs.readFileSync(yamlPath, "utf8"));
  return normalizeSemver(data.version || "");
}

function readVersionFromPackageJson(skillDir) {
  const packagePath = path.join(skillDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return "";
  }
  try {
    const data = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return normalizeSemver(data.version || "");
  } catch {
    return "";
  }
}

function normalizeSemver(value) {
  if (!value) {
    return "";
  }
  const match = String(value).trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?((?:-[0-9A-Za-z.-]+)?)$/);
  if (!match) {
    return "";
  }
  return `${match[1]}.${match[2] || "0"}.${match[3] || "0"}${match[4] || ""}`;
}

function inferValidateCommand(skillDir) {
  const scriptsDir = path.join(skillDir, "scripts");
  if (!fs.existsSync(scriptsDir)) {
    return "";
  }

  const pythonScripts = fs.readdirSync(scriptsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".py"))
    .map((entry) => `scripts/${entry.name}`)
    .sort();

  if (pythonScripts.length === 1) {
    return `python -m py_compile ${pythonScripts[0]}`;
  }

  return "";
}

function writeImportedSkillYaml(targetDir, options) {
  const lines = [
    `id: ${options.id}`,
    `domain: ${options.domain}`,
    `version: ${options.version}`,
    "entry: SKILL.md",
    "status: active",
    "",
    "source:"
  ];

  if (options.source.kind === "git") {
    lines.push(`  repository: ${quoteYaml(options.source.repository)}`);
    if (options.source.ref) {
      lines.push(`  ref: ${quoteYaml(options.source.ref)}`);
    }
    lines.push(`  commit: ${quoteYaml(options.source.commit)}`);
  } else {
    lines.push(`  path: ${quoteYaml(options.source.path)}`);
    if (options.source.repository) {
      lines.push(`  repository: ${quoteYaml(options.source.repository)}`);
    }
    if (options.source.commit) {
      lines.push(`  commit: ${quoteYaml(options.source.commit)}`);
    }
  }

  lines.push(
    "",
    "validate:",
    `  command: ${quoteYaml(options.validateCommand)}`,
    "",
    "package:",
    "  command: \"\"",
    "",
    "release:",
    `  tag: ${options.id}@${options.version}`,
    ""
  );

  fs.writeFileSync(path.join(targetDir, "skill.yaml"), `${lines.join("\n")}\n`);
}

function ensureImportedReadme(targetDir, options) {
  const readmePath = path.join(targetDir, "README.md");
  if (fs.existsSync(readmePath)) {
    return;
  }

  const content = `# ${titleize(options.id)}

\`${options.id}\` 是迁移到 \`nexgaios-skills\` monorepo 的 Codex skill。

## 当前版本

\`\`\`text
${options.version}
\`\`\`

## 来源

${formatSourceBlock(options.source)}

## 仓库位置

\`\`\`text
skills/${options.domain}/${options.id}
\`\`\`

## 开发命令

\`\`\`powershell
pnpm skill:validate ${options.id}
pnpm skill:install ${options.id}
pnpm skill:package ${options.id} --print-path
\`\`\`
`;

  fs.writeFileSync(readmePath, content);
}

function ensureImportedChangelog(targetDir, options) {
  const changelogPath = path.join(targetDir, "CHANGELOG.md");
  if (fs.existsSync(changelogPath)) {
    return;
  }

  const content = `# 更新日志

## ${options.version} - ${today()}

- 迁移到 \`nexgaios-skills\` monorepo。
- 补充 \`skill.yaml\`，纳入独立版本发布流程。
${formatSourceListItem(options.source)}
`;

  fs.writeFileSync(changelogPath, content);
}

function formatSourceBlock(source) {
  if (source.kind === "git") {
    return [
      "```text",
      `仓库：${source.repository}`,
      source.ref ? `Ref：${source.ref}` : "",
      `Commit：${source.commit}`,
      "```"
    ].filter(Boolean).join("\n");
  }

  return [
    "```text",
    `本地路径：${source.path}`,
    source.repository ? `仓库：${source.repository}` : "",
    source.commit ? `Commit：${source.commit}` : "",
    "```"
  ].filter(Boolean).join("\n");
}

function formatSourceListItem(source) {
  if (source.kind === "git") {
    return `- 来源：${source.repository}${source.ref ? `（${source.ref}）` : ""}。`;
  }
  return `- 来源：${source.path}。`;
}

function quoteYaml(value) {
  return JSON.stringify(value || "");
}

function copyTemplateDir(source, target, replacements) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyTemplateDir(sourcePath, targetPath, replacements);
    } else if (entry.isFile()) {
      const content = replaceTokens(fs.readFileSync(sourcePath, "utf8"), replacements);
      fs.writeFileSync(targetPath, content);
    }
  }
}

function replaceTokens(content, replacements) {
  let result = content;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value);
  }
  return result;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

function markdownEscape(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, " ");
}

function markdownCode(value) {
  return `\`${String(value || "").replaceAll("`", "\\`")}\``;
}

function markdownLink(label, targetPath) {
  return `[${markdownEscape(label)}](${targetPath.replaceAll("\\", "/")})`;
}

function repositoryIdentity() {
  const remote = spawnSync("git", ["config", "--get", "remote.origin.url"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    shell: false
  });

  if (remote.status === 0 && remote.stdout.trim()) {
    return remote.stdout.trim().replace(/\.git$/, "");
  }

  return repoRoot;
}

function copyDir(source, target, predicate) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (!predicate(sourcePath, entry)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath, predicate);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function shouldCopySkillFile(sourcePath, entry) {
  const ignored = new Set([
    ".git",
    "node_modules",
    "dist",
    ".DS_Store",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    "artifacts",
    "data",
    ".env",
    installMarkerFile
  ]);
  return !ignored.has(entry.name) && !sourcePath.includes(`${path.sep}.git${path.sep}`);
}

function shouldCopyImportFile(sourcePath, entry) {
  const ignored = new Set([
    ".git",
    ".github",
    "node_modules",
    "dist",
    ".DS_Store",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    "artifacts",
    "data",
    ".env",
    installMarkerFile
  ]);
  return !ignored.has(entry.name) && !sourcePath.includes(`${path.sep}.git${path.sep}`);
}

function assertPathInside(targetPath, parentPath) {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(targetPath));
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`路径不在允许范围内：${targetPath}`);
  }
}

function assertImportSourceTargetSafe(sourceDir, targetDir) {
  const resolvedSource = path.resolve(sourceDir);
  const resolvedTarget = path.resolve(targetDir);
  const sourceToTarget = path.relative(resolvedSource, resolvedTarget);
  const targetToSource = path.relative(resolvedTarget, resolvedSource);

  if (!sourceToTarget || !targetToSource) {
    throw new Error("导入源目录不能和目标技能目录相同");
  }

  if (!sourceToTarget.startsWith("..") && !path.isAbsolute(sourceToTarget)) {
    throw new Error("目标技能目录不能位于导入源目录内部");
  }

  if (!targetToSource.startsWith("..") && !path.isAbsolute(targetToSource)) {
    throw new Error("导入源目录不能位于目标技能目录内部");
  }
}

function relative(targetPath) {
  return path.relative(repoRoot, targetPath);
}

function run(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(`${commandName} ${commandArgs.join(" ")} 执行失败`);
  }

  return options.capture ? result.stdout : "";
}

function runShell(commandLine, options = {}) {
  const result = spawnSync(commandLine, [], {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    shell: true
  });

  if (result.status !== 0) {
    throw new Error(`命令执行失败：${commandLine}`);
  }
}

function runQuiet(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: options.cwd || repoRoot,
    stdio: "ignore",
    shell: false
  });
  return result.status === 0;
}

function gitLines(commandArgs) {
  const output = run("git", commandArgs, { cwd: repoRoot, capture: true });
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function ensureGitRepo() {
  if (!runQuiet("git", ["rev-parse", "--show-toplevel"], { cwd: repoRoot })) {
    throw new Error(`${repoRoot} 不是 Git 仓库`);
  }
}
