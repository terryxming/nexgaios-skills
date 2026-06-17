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
    case "changed":
      return changedCommand(args);
    case "validate":
      return validateCommand(args);
    case "install":
      return installCommand(args);
    case "package":
      return packageCommand(args);
    case "ship":
      return shipCommand(args);
    case "version":
      return versionCommand(args);
    case "info":
      return infoCommand(args);
    case "version-changed":
      return versionChangedCommand(args);
    default:
      throw new Error(`Unknown command "${command}". Run "pnpm skill:list" or "node tools/skills/skill-cli.mjs help".`);
  }
}

function printHelp() {
  console.log(`nexgaios skill CLI

Commands:
  list [--write-catalog]
  new <domain> <skill-id>
  changed [--base <git-range-or-ref>]
  validate <skill-id>|--all
  install <skill-id> [--target <path>]
  package <skill-id> [--print-path]
  ship <skill-id> [--patch|--minor|--major|--no-release] [-m <message>]
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
    console.log("No skills found.");
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
    throw new Error(`Skill already exists at ${relative(targetDir)}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const replacements = {
    "{{domain}}": domain,
    "{{skill_id}}": skillId,
    "{{title}}": titleize(skillId),
    "{{date}}": today()
  };

  for (const fileName of ["skill.yaml", "SKILL.md", "README.md", "CHANGELOG.md"]) {
    const templatePath = path.join(templatesRoot, fileName);
    const targetPath = path.join(targetDir, fileName);
    const content = replaceTokens(fs.readFileSync(templatePath, "utf8"), replacements);
    fs.writeFileSync(targetPath, content);
  }

  writeCatalog(loadSkills());
  console.log(`Created ${relative(targetDir)}`);
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
    console.log("No skills to validate.");
    return;
  }

  for (const skill of skills) {
    validateSkill(skill);
    const validateCommand = skill.validate?.command;
    if (validateCommand) {
      runShell(validateCommand, { cwd: skill.dir });
    }
    console.log(`Validated ${skill.id}`);
  }
}

function installCommand(rawArgs) {
  const { flags, positionals } = parseOptions(rawArgs);
  const [skillId] = positionals;
  const skill = findSkill(skillId);
  const targetRoot = path.resolve(flags.target || path.join(os.homedir(), ".codex", "skills"));
  const targetDir = path.join(targetRoot, skill.id);

  fs.mkdirSync(targetRoot, { recursive: true });
  fs.rmSync(targetDir, { recursive: true, force: true });
  copyDir(skill.dir, targetDir, shouldCopySkillFile);
  console.log(`Installed ${skill.id} to ${targetDir}`);
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

  run("tar", ["-czf", outputPath, "-C", skill.dir, "."], { cwd: repoRoot });

  if (flags.printPath) {
    console.log(outputPath);
  } else {
    console.log(`Packaged ${skill.id} to ${outputPath}`);
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
      throw new Error(`Unknown info field "${flags.field}"`);
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
    throw new Error("--base is required");
  }

  const oldVersion = readSkillVersionAtRef(skill, base);
  if (oldVersion !== skill.version) {
    console.log(`${skill.id}: ${oldVersion || "(new)"} -> ${skill.version}`);
    return;
  }

  process.exitCode = 1;
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
    throw new Error("A skill id is required");
  }

  const skill = loadSkills().find((candidate) => candidate.id === skillId);
  if (!skill) {
    throw new Error(`Skill "${skillId}" was not found`);
  }
  return skill;
}

function validateSkill(skill) {
  const missing = ["id", "domain", "version", "entry", "status"].filter((field) => !skill[field]);
  if (missing.length > 0) {
    throw new Error(`${skill.relativeDir}/skill.yaml is missing: ${missing.join(", ")}`);
  }

  assertSlug(skill.id, "id");
  assertSlug(skill.domain, "domain");

  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(skill.version)) {
    throw new Error(`${skill.id} has invalid semver version "${skill.version}"`);
  }

  const expectedDir = path.join(skillsRoot, skill.domain, skill.id);
  if (path.resolve(skill.dir) !== path.resolve(expectedDir)) {
    throw new Error(`${skill.id} must live at ${relative(expectedDir)}`);
  }

  const entryPath = path.join(skill.dir, skill.entry);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`${skill.id} entry file not found: ${relative(entryPath)}`);
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
    "# This file is generated by `pnpm skill:list --write-catalog`.",
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

function changedFiles(base) {
  ensureGitRepo();

  if (base) {
    return gitLines(["diff", "--name-only", base]);
  }

  const statusFiles = gitLines(["status", "--porcelain"])
    .map((line) => line.slice(3).trim())
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

function isSharedToolingPath(file) {
  const normalized = file.replaceAll("\\", "/");
  return normalized === "catalog.yaml"
    || normalized.startsWith("tools/")
    || normalized.startsWith("templates/")
    || normalized.startsWith(".github/workflows/");
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
    throw new Error("Use only one release flag: --patch, --minor, --major, or --no-release");
  }
}

function bumpVersion(version, mode) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Cannot bump invalid version "${version}"`);
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
    fs.writeFileSync(changelogPath, `# Changelog\n\n${entry}`);
    return;
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  const updated = content.replace(/^# Changelog\s*/m, `# Changelog\n\n${entry}`);
  fs.writeFileSync(changelogPath, updated);
}

function ensureWorktreeHasSkillChanges(skill) {
  const files = changedFiles();
  const prefix = relative(skill.dir).replaceAll("\\", "/");
  const hasSkillChanges = files.some((file) => file.replaceAll("\\", "/").startsWith(prefix));
  if (!hasSkillChanges) {
    throw new Error(`No changes found under ${prefix}`);
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
    console.log("GitHub CLI was not found. Open a PR manually from the pushed branch.");
    return;
  }

  if (!runQuiet(gh, ["auth", "status"], { cwd: repoRoot })) {
    console.log(`GitHub CLI is installed, but not logged in. Run \`gh auth login\`, then create the PR with: gh pr create --fill --title "${message}" --head ${branch}`);
    return;
  }

  const result = spawnSync(gh, ["pr", "create", "--fill", "--title", message, "--head", branch], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    console.log("Branch was pushed, but PR creation did not complete. You can open it from GitHub.");
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
    return `chore(${skill.id}): update skill`;
  }
  return `release(${skill.id}): bump ${releaseMode} version`;
}

function assertSlug(value, label) {
  if (!value || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error(`${label} must be lowercase kebab-case`);
  }
}

function titleize(value) {
  return value.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  const ignored = new Set([".git", "node_modules", "dist", ".DS_Store"]);
  return !ignored.has(entry.name) && !sourcePath.includes(`${path.sep}.git${path.sep}`);
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
    throw new Error(`${commandName} ${commandArgs.join(" ")} failed`);
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
    throw new Error(`Command failed: ${commandLine}`);
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
    throw new Error(`${repoRoot} is not a git repository`);
  }
}
