/**
 * Config loading + resolution. `resolveConfig` is pure (file contents + env in,
 * fully-populated config out) so the merge/override logic is unit-testable;
 * `loadConfig` is the thin filesystem wrapper the hooks call at runtime.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CostRule } from "./cost.js";
import type { PolicyConfig } from "./policy.js";

export type InjectionMode = "warn" | "ask" | "deny";

export interface CostSettings {
  maxPerDispatchUSD: number;
  dailyBudgetUSD: number;
  maxPerHourPctOfDaily: number;
  ledgerPath: string;
  rules: CostRule[];
}

export interface InjectionSettings {
  enabled: boolean;
  mode: InjectionMode;
  watchSubstrings: string[];
}

export interface GuardrailsConfig {
  cost: CostSettings;
  policy: PolicyConfig;
  injection: InjectionSettings;
}

export const DEFAULT_CONFIG: GuardrailsConfig = {
  cost: {
    maxPerDispatchUSD: 2,
    dailyBudgetUSD: 50,
    maxPerHourPctOfDaily: 10,
    ledgerPath: ".claude/cost-ledger.jsonl",
    rules: [
      { pattern: "claude\\s+-p\\b", estimatedUSD: 0.5, label: "headless Claude dispatch" },
      {
        pattern: "--parallel(?:=|\\s+)(\\d+)",
        estimatedUSD: 0,
        perMatchGroupUSD: 0.2,
        label: "parallel fan-out (per worker)",
      },
      { pattern: "\\bplaywright\\b", estimatedUSD: 0.1, label: "browser automation run" },
      { pattern: "(?:openai|anthropic|perplexity)", estimatedUSD: 0.1, label: "LLM API call" },
    ],
  },
  policy: {
    reason: "Blocked by claude-guardrails policy gate. Override via an explicit operator decision.",
    denyPatterns: [
      "rm\\s+-rf\\s+/(?:\\s|$)",
      "rm\\s+-rf\\s+~",
      "rm\\s+-rf\\s+\\$HOME",
      "\\bmkfs\\b",
      "dd\\s+if=.*of=/dev/",
      ">\\s*/dev/sd",
      "chmod\\s+-R?\\s*777\\s+/",
      "curl[^|]*(?:credentials|secrets|\\.env|id_rsa)",
      "wget[^|]*(?:credentials|secrets|\\.env|id_rsa)",
      "cat\\s+[^|]*(?:\\.ssh/|\\.aws/credentials|id_rsa)",
      "git\\s+push\\b.*--force.*\\b(?:main|master)\\b",
      "curl[^|]*\\|\\s*(?:sh|bash)\\b",
    ],
    askPatterns: [
      "\\bsudo\\b",
      "rm\\s+-rf\\b",
      "npm\\s+publish\\b",
      "gh\\s+repo\\s+create\\b.*--public",
      "git\\s+push\\b.*--force",
    ],
  },
  injection: {
    enabled: true,
    mode: "warn",
    watchSubstrings: [".planning/", "CLAUDE.md", "AGENTS.md", ".claude/", ".context/", ".cursor/"],
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function num(envVal: string | undefined, fallback: number): number {
  if (envVal == null) return fallback;
  const n = Number.parseFloat(envVal);
  return Number.isFinite(n) ? n : fallback;
}

/** Pure merge: defaults <- file config <- env overrides. */
export function resolveConfig(
  fileConfig: DeepPartial<GuardrailsConfig> | null,
  env: NodeJS.ProcessEnv = {},
): GuardrailsConfig {
  const f = fileConfig ?? {};
  const merged: GuardrailsConfig = {
    cost: { ...DEFAULT_CONFIG.cost, ...(f.cost as Partial<CostSettings>) },
    policy: { ...DEFAULT_CONFIG.policy, ...(f.policy as Partial<PolicyConfig>) },
    injection: { ...DEFAULT_CONFIG.injection, ...(f.injection as Partial<InjectionSettings>) },
  };

  // env overrides win over everything
  merged.cost.maxPerDispatchUSD = num(
    env.CLAUDE_GUARDRAILS_MAX_PER_DISPATCH_USD,
    merged.cost.maxPerDispatchUSD,
  );
  merged.cost.dailyBudgetUSD = num(
    env.CLAUDE_GUARDRAILS_DAILY_BUDGET_USD,
    merged.cost.dailyBudgetUSD,
  );
  merged.cost.maxPerHourPctOfDaily = num(
    env.CLAUDE_GUARDRAILS_MAX_PER_HOUR_PCT,
    merged.cost.maxPerHourPctOfDaily,
  );
  if (env.CLAUDE_GUARDRAILS_LEDGER_PATH) merged.cost.ledgerPath = env.CLAUDE_GUARDRAILS_LEDGER_PATH;

  const mode = env.CLAUDE_GUARDRAILS_INJECTION_MODE;
  if (mode === "warn" || mode === "ask" || mode === "deny") merged.injection.mode = mode;

  return merged;
}

/** Read guardrails.config.json from the project (cwd or .claude/), then resolve. */
export function loadConfig(cwd: string, env: NodeJS.ProcessEnv = process.env): GuardrailsConfig {
  const candidates = [
    resolve(cwd, "guardrails.config.json"),
    resolve(cwd, ".claude/guardrails.config.json"),
  ];
  let fileConfig: DeepPartial<GuardrailsConfig> | null = null;
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        fileConfig = JSON.parse(readFileSync(path, "utf8")) as DeepPartial<GuardrailsConfig>;
        break;
      } catch {
        // ignore malformed config, fall back to defaults
      }
    }
  }
  return resolveConfig(fileConfig, env);
}

/** Global kill switch — set CLAUDE_GUARDRAILS_DISABLE=1 to no-op all hooks. */
export function guardrailsDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.CLAUDE_GUARDRAILS_DISABLE);
}
