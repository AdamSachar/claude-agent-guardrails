#!/usr/bin/env node
/**
 * Installer — wires the guardrail hooks into a project's .claude/settings.json
 * and drops a starter guardrails.config.json. Idempotent: re-running won't add
 * duplicate entries.
 *
 *   npx claude-guardrails            # install into the current directory
 *   npx claude-guardrails /path/to/project
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface CommandHook {
  type: "command";
  command: string;
}
interface MatcherGroup {
  matcher: string;
  hooks: CommandHook[];
}
type HooksConfig = Record<string, MatcherGroup[]>;
interface Settings {
  hooks?: HooksConfig;
  [k: string]: unknown;
}

const TAG = "claude-guardrails";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "../..");
const hookDir = resolve(pkgRoot, "dist/hooks");

const targetDir = resolve(process.argv[2] ?? process.cwd());
const claudeDir = resolve(targetDir, ".claude");
const settingsPath = resolve(claudeDir, "settings.json");

const PLAN: { event: string; matcher: string; script: string }[] = [
  { event: "PreToolUse", matcher: "Bash", script: "policy-gate.js" },
  { event: "PreToolUse", matcher: "Bash", script: "cost-guard.js" },
  { event: "PreToolUse", matcher: "Write|Edit", script: "injection-guard.js" },
  { event: "PostToolUse", matcher: "*", script: "cost-velocity.js" },
];

function loadSettings(): Settings {
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, "utf8")) as Settings;
  } catch {
    console.error(`! Could not parse ${settingsPath} — aborting to avoid clobbering it.`);
    process.exit(1);
  }
}

function alreadyInstalled(hooks: HooksConfig): boolean {
  return Object.values(hooks)
    .flat()
    .some((g) => g.hooks?.some((h) => h.command.includes(TAG)));
}

function addHook(hooks: HooksConfig, event: string, matcher: string, command: string): void {
  const groups = (hooks[event] ??= []);
  let group = groups.find((g) => g.matcher === matcher);
  if (!group) {
    group = { matcher, hooks: [] };
    groups.push(group);
  }
  if (!group.hooks.some((h) => h.command === command)) {
    group.hooks.push({ type: "command", command });
  }
}

function main(): void {
  const settings = loadSettings();
  const hooks: HooksConfig = settings.hooks ?? {};

  if (alreadyInstalled(hooks)) {
    console.log("✓ claude-guardrails hooks already installed — nothing to do.");
  } else {
    for (const { event, matcher, script } of PLAN) {
      addHook(hooks, event, matcher, `node "${resolve(hookDir, script)}"`);
    }
    settings.hooks = hooks;
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    console.log(`✓ Wired 4 guardrail hooks into ${settingsPath}`);
  }

  // Drop a starter config if the project doesn't have one yet.
  const cfgDest = resolve(targetDir, "guardrails.config.json");
  if (!existsSync(cfgDest)) {
    copyFileSync(resolve(pkgRoot, "guardrails.config.json"), cfgDest);
    console.log(`✓ Wrote starter ${cfgDest}`);
  } else {
    console.log("• guardrails.config.json already present — left as-is.");
  }

  console.log(
    "\nNext: restart Claude Code in this project. Tune thresholds in guardrails.config.json.\n" +
      "Disable temporarily with CLAUDE_GUARDRAILS_DISABLE=1.",
  );
}

main();
