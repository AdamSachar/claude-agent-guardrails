# Claude for Open Source application draft

## Selected repository

`https://github.com/AdamSachar/claude-agent-guardrails`

## Tell us about the project's reach and impact

`claude-agent-guardrails` is an MIT-licensed TypeScript package for maintainers who run Claude Code on real repositories and want local, deterministic guardrails around autonomous agent behavior.

It packages six Claude Code hooks:

- `cost-guard`: denies Bash commands that exceed a configured cost cap.
- `cost-velocity`: warns when recent spend burns too much of a daily budget.
- `policy-gate`: denies destructive commands, secret reads, and risky force pushes.
- `injection-guard`: warns when prompt-injection text is written into agent context files.
- `instruction-receipt`: reminds agents to read local repo instructions before real work.
- `context-budget`: warns on oversized prompts and transcripts before long runs drift.

The project is meant to be both a usable package and a reference implementation for safe Claude Code hooks. It includes pure core modules, thin hook entrypoints, a one-command installer, a hook simulator CLI, example payloads, CI, Dependabot, issue templates, security policy, OpenSSF Scorecard workflow, 47 unit tests, and dry-pack verification.

This is an early project rather than a mature package with large download numbers. I am applying under the program's "ecosystem quietly depends on it" clause because Claude Code adoption is moving faster than hook-policy examples and safety defaults. The project gives maintainers a copyable baseline for cost control, command policy, context hygiene, and prompt-injection handling without a cloud service or telemetry.

## How will you use the subscription for your project?

I will use Claude Max to dogfood and maintain `claude-agent-guardrails` in real Claude Code sessions without charging users or adding telemetry.

The work requires repeated Claude Code testing:

- Keep hook behavior aligned with the current Claude Code hook contract.
- Expand command-policy fixtures from real autonomous-agent failures.
- Add a hook simulator output suite for every example payload.
- Build recipes for monorepos, worktrees, and team presets.
- Review bug reports and PRs for safety regressions.
- Publish small releases quickly when Claude Code hook behavior changes.

Claude Max is directly relevant because the project protects Claude Code operators. I need enough Claude usage to test the hooks under realistic sessions, capture edge cases, and document behavior accurately for maintainers.

## Other info

The package is local-first. It does not upload prompts, secrets, transcripts, or telemetry. It does not auto-execute commands. It only evaluates Claude Code hook payloads and returns Claude Code hook decisions.

Current receipts before public submission:

- `npm run check` passes.
- `npm run build` passes.
- `npm run pack:dry` passes.
- Simulator CLI works.
- Hook demos return valid Claude Code hook JSON.
- No paid API is required to use or test the package.
