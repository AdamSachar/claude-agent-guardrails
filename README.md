# claude-guardrails

> **Cost & safety guardrails for autonomous Claude Code agents.** Four hooks that stop
> runaway spend, destructive commands, and prompt injection — before they happen.

[![CI](https://github.com/USER/claude-guardrails/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/claude-guardrails/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue)
![types](https://img.shields.io/badge/types-TypeScript-blue)

<!-- demo GIF here: a denied over-budget dispatch + a blocked `rm -rf /` -->

## The problem

Autonomous coding agents are great until the night they fan out 30 parallel sub-agents and
burn your month's budget in an hour, run a destructive command, or quietly ingest a
prompt-injection payload from a file they were told to read. Claude Code's hook system can
prevent all three — but writing correct hooks (current stdin/JSON contract, `permissionDecision`
semantics, no false-positive deadlocks) is fiddly. This is that, done right, in one install.

## What it does

Four hooks, wired via `.claude/settings.json`:

| Hook | Event | What it does |
|---|---|---|
| **cost-guard** | `PreToolUse(Bash)` | Predicts a command's $ cost and **denies** it if it exceeds your per-dispatch cap. |
| **cost-velocity** | `PostToolUse(*)` | Reads a spend ledger and **warns** when the last hour's burn-rate would blow the daily budget. |
| **policy-gate** | `PreToolUse(Bash)` | **Denies** destructive / secret-exfil commands (`rm -rf /`, `cat ~/.ssh/*`, `curl … | sh`), **asks** on sensitive ones (`sudo`, force-push). |
| **injection-guard** | `PreToolUse(Write\|Edit)` | Scans writes to agent-context files (`CLAUDE.md`, `.planning/`, …) for prompt-injection patterns + invisible Unicode. Advisory by default. |

All decisions use the sanctioned **exit-0 + JSON** control path (`hookSpecificOutput.permissionDecision`),
not brittle exit codes. Pure, tested core logic; thin hook entrypoints.

## Install

```bash
npx claude-guardrails            # into the current project
# or
npx claude-guardrails /path/to/project
```

This wires the four hooks into `.claude/settings.json` (idempotent) and drops a starter
`guardrails.config.json`. Restart Claude Code in the project and you're protected.

Manual install: `git clone … && npm install && npm run build && node dist/cli/install.js /path/to/project`.

## Configure

Edit `guardrails.config.json` in your project. Everything is tunable:

```jsonc
{
  "cost": {
    "maxPerDispatchUSD": 2,            // deny a single Bash dispatch over this
    "dailyBudgetUSD": 50,
    "maxPerHourPctOfDaily": 10,        // alarm if >10% of daily spent in 1h
    "ledgerPath": ".claude/cost-ledger.jsonl",
    "rules": [                          // YOUR costly-command patterns
      { "pattern": "claude\\s+-p\\b", "estimatedUSD": 0.5, "label": "headless dispatch" },
      { "pattern": "--parallel(?:=|\\s+)(\\d+)", "estimatedUSD": 0,
        "perMatchGroupUSD": 0.2, "label": "parallel fan-out (per worker)" }
    ]
  },
  "policy": { "denyPatterns": ["rm\\s+-rf\\s+/(?:\\s|$)", "..."], "askPatterns": ["\\bsudo\\b"] },
  "injection": { "enabled": true, "mode": "warn", "watchSubstrings": [".planning/", "CLAUDE.md"] }
}
```

**Env overrides** (win over the file): `CLAUDE_GUARDRAILS_MAX_PER_DISPATCH_USD`,
`CLAUDE_GUARDRAILS_DAILY_BUDGET_USD`, `CLAUDE_GUARDRAILS_MAX_PER_HOUR_PCT`,
`CLAUDE_GUARDRAILS_LEDGER_PATH`, `CLAUDE_GUARDRAILS_INJECTION_MODE`.
**Kill switch:** `CLAUDE_GUARDRAILS_DISABLE=1` no-ops every hook.

### Cost ledger

`cost-velocity` reads a JSONL ledger you append to (one object per line):

```jsonl
{"ts": 1733320000000, "cost_usd": 0.42, "label": "opus dispatch"}
```

If the file doesn't exist, the hook is a no-op — adopt it when you start logging spend.

## How it behaves (real hook output)

```
# over-budget dispatch → DENIED
$ echo '{"tool_name":"Bash","tool_input":{"command":"run --parallel=20 agents"}}' | node dist/hooks/cost-guard.js
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",
 "permissionDecisionReason":"Predicted cost $4.00 exceeds the per-dispatch cap of $2 ..."}}

# rm -rf /  → DENIED ;  ls -la → allowed (no output)
```

## Design

- `src/core/` — pure, unit-tested logic (`cost`, `policy`, `injection`, `config`, `protocol`). 37 tests.
- `src/hooks/` — thin entrypoints: read stdin → call core → emit decision.
- `src/cli/install.ts` — idempotent settings.json wiring.

Why pure core + thin hooks: the security-relevant logic is testable without spawning a real
agent, and the hooks stay trivially correct.

## Roadmap

- `context-monitor` hook (inject "wrap up" warnings as context fills)
- read-receipt gate (must load CLAUDE.md before edits)
- ledger auto-append helper + a `costs` report command

## License

MIT © Adam Sacharowitz
