# Claude for Open Source application draft

## Selected repository

`https://github.com/AdamSachar/claude-agent-guardrails`

## Project reach and impact

`claude-agent-guardrails` is a TypeScript hook package for Claude Code that gives maintainers deterministic safety controls for autonomous coding agents. It installs four tested hooks: cost caps, cost velocity warnings, destructive-command policy gates, and prompt-injection warnings for agent context files.

The package is built for developers who let Claude Code work across real repositories and need guardrails around spend, shell commands, and context poisoning. The core logic is pure TypeScript with 37 unit tests, typecheck, lint, CI, MIT license, issue templates, security policy, and a one-command `npx` installer.

This does not yet meet the numeric thresholds for a mature dependency, but it directly serves a fast-growing open-source workflow: maintainers using Claude Code to operate on their own projects. The gap it fills is practical: Claude Code hooks are powerful, but safe defaults and correct JSON decision semantics are easy to get wrong. This package turns those patterns into reusable open-source infrastructure.

## How I will use the subscription for the project

I will use Claude Max to maintain and improve the project without passing those costs to users. The main work is security-sensitive and review-heavy: expanding the risky-command fixture set, testing hook behavior against real Claude Code workflows, writing clearer docs, triaging user reports, and adding new guardrails like context-window warnings and read-receipt gates for `CLAUDE.md` and `AGENTS.md`.

Claude Max is especially useful here because the project is about Claude Code itself. It lets me test the hooks in realistic sessions, generate and review edge-case payloads, and keep the package aligned with Claude Code's current hook contract.

## Other info

The repository is being prepared for public launch under the name `claude-agent-guardrails` because the shorter npm name `claude-agent-guardrails` is already taken. Before submission I will publish the GitHub repo, publish the npm package, enable CI, add a demo GIF, and open beginner-friendly issues for external contributors.

## Receipts to attach after launch

- GitHub repository URL.
- npm package URL.
- CI passing badge.
- `npm run check` output showing 37 tests passing.
- `npm pack --dry-run` output.
- Screenshot or GIF showing a blocked over-budget command.
- Screenshot or GIF showing a destructive command being denied.
