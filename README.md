# claude-agent-guardrails

Deterministic cost, policy, context, and prompt-injection guardrails for Claude Code agents.

[![CI](https://github.com/AdamSachar/claude-agent-guardrails/actions/workflows/ci.yml/badge.svg)](https://github.com/AdamSachar/claude-agent-guardrails/actions/workflows/ci.yml)
[![Scorecard](https://github.com/AdamSachar/claude-agent-guardrails/actions/workflows/scorecard.yml/badge.svg)](https://github.com/AdamSachar/claude-agent-guardrails/actions/workflows/scorecard.yml)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)

`claude-agent-guardrails` installs six Claude Code hooks that stop common autonomous-agent failures before they happen:

| Hook | Event | What it prevents |
|---|---|---|
| `cost-guard` | `PreToolUse(Bash)` | A single agent dispatch exceeding your cost cap. |
| `cost-velocity` | `PostToolUse(*)` | A session burning through the daily budget too quickly. |
| `policy-gate` | `PreToolUse(Bash)` | Destructive shell commands, secret reads, and risky force pushes. |
| `injection-guard` | `PreToolUse(Write\|Edit)` | Prompt-injection text being written into agent context files. |
| `instruction-receipt` | `UserPromptSubmit(*)` | Agents starting real work without reading local repo instructions. |
| `context-budget` | `UserPromptSubmit(*)` | Oversized prompts or transcripts that make long autonomous runs drift. |

The project is built for people who run Claude Code on real repositories and need deterministic guardrails around autonomous sessions.

## Why this exists

Claude Code hooks are powerful, but correct hook wiring is easy to get wrong. This package gives maintainers a tested default:

- Uses Claude Code's supported hook JSON path.
- Keeps security logic in pure TypeScript modules with unit tests.
- Installs idempotently into `.claude/settings.json`.
- Ships a starter `guardrails.config.json`.
- Lets teams tune thresholds without editing hook code.
- Keeps the agent aware of `CLAUDE.md`, `AGENTS.md`, and context-size risk before work begins.

## Install

Install from the GitHub release:

```bash
npm install -g https://github.com/AdamSachar/claude-agent-guardrails/releases/download/v0.2.0/claude-agent-guardrails-0.2.0.tgz
claude-agent-guardrails
```

Install into another project:

```bash
claude-agent-guardrails /path/to/project
```

The npm package name is reserved for public npm release, but the GitHub release tarball is installable now.

After npm publish, this shorter install path will work:

```bash
npx claude-agent-guardrails
```

After npm publish, install into another project:

```bash
npx claude-agent-guardrails /path/to/project
```

Then restart Claude Code in that project.

Test a hook before installing:

```bash
npx claude-agent-guardrails-sim cost-guard
npx claude-agent-guardrails-sim policy-gate examples/policy-deny.json
```

## Configure

Edit `guardrails.config.json`:

```jsonc
{
  "cost": {
    "maxPerDispatchUSD": 2,
    "dailyBudgetUSD": 50,
    "maxPerHourPctOfDaily": 10,
    "ledgerPath": ".claude/cost-ledger.jsonl",
    "rules": [
      { "pattern": "claude\\s+-p\\b", "estimatedUSD": 0.5, "label": "headless Claude dispatch" },
      {
        "pattern": "--parallel(?:=|\\s+)(\\d+)",
        "estimatedUSD": 0,
        "perMatchGroupUSD": 0.2,
        "label": "parallel fan-out"
      }
    ]
  },
  "policy": {
    "denyPatterns": ["rm\\s+-rf\\s+/(?:\\s|$)"],
    "askPatterns": ["\\bsudo\\b"]
  },
  "injection": {
    "enabled": true,
    "mode": "warn",
    "watchSubstrings": [".planning/", "CLAUDE.md", "AGENTS.md", ".claude/"]
  },
  "context": {
    "maxPromptChars": 12000,
    "maxTranscriptBytes": 2000000
  },
  "instructions": {
    "enabled": true,
    "instructionFiles": ["CLAUDE.md", "AGENTS.md", "README.md", ".claude/settings.json"],
    "promptPatterns": ["\\bbuild\\b", "\\bfix\\b", "\\bimplement\\b", "\\btest\\b"]
  }
}
```

Environment overrides:

- `CLAUDE_GUARDRAILS_MAX_PER_DISPATCH_USD`
- `CLAUDE_GUARDRAILS_DAILY_BUDGET_USD`
- `CLAUDE_GUARDRAILS_MAX_PER_HOUR_PCT`
- `CLAUDE_GUARDRAILS_LEDGER_PATH`
- `CLAUDE_GUARDRAILS_INJECTION_MODE`
- `CLAUDE_GUARDRAILS_MAX_PROMPT_CHARS`
- `CLAUDE_GUARDRAILS_MAX_TRANSCRIPT_BYTES`
- `CLAUDE_GUARDRAILS_DISABLE=1`

## Real hook output

Over-budget dispatch:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"run --parallel=20 agents"}}' \
  | node dist/hooks/cost-guard.js
```

Output:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Predicted cost $4.00 exceeds the per-dispatch cap of $2."
  }
}
```

## Project structure

- `src/core/`: pure policy, cost, injection, config, and protocol logic.
- `src/hooks/`: thin Claude Code hook entrypoints.
- `src/cli/install.ts`: idempotent installer.
- `src/cli/simulate.ts`: local hook simulator for demos and debugging.
- `examples/`: copy-paste Claude Code hook payloads.
- `.github/`: CI, issue templates, and contributor workflow.

## Development

```bash
npm install
npm run check
npm run build
npm run pack:dry
```

Current verification:

- 47 unit tests.
- TypeScript typecheck.
- ESLint.
- MIT license.

## Roadmap

- `costs` report command.
- Contributor examples for real Claude Code workflows.
- Cost ledger auto-append helper.

## Contributing

Bug reports, hook ideas, and small test cases are welcome. The best first contribution is a new failing fixture for a command that should be denied, asked, or allowed.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © Adam Sacharowitz
