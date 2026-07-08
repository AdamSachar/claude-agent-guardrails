# Impact

`claude-agent-guardrails` is open-source infrastructure for maintainers who let Claude Code operate on real repositories.

The project exists because autonomous coding agents create three practical risks for maintainers:

1. Cost runaway from unattended fan-out.
2. Shell and publish commands that should stop for a human.
3. Context poisoning through instruction files and long transcripts.

This package turns those risks into deterministic hooks with tests. It is intentionally small: pure TypeScript policy logic, thin Claude Code hook entrypoints, and a one-command installer.

## Who benefits

- Open-source maintainers using Claude Code on active repositories.
- Teams standardizing Claude Code hook policy across projects.
- Developers learning how to write safe Claude Code hooks.
- Security-minded users who want local, inspectable guardrails instead of cloud policy.

## Current evidence

- MIT licensed.
- Six hook entrypoints.
- Pure core modules with unit tests.
- CI, issue templates, pull request template, Dependabot, and security policy.
- Published npm package.
- Installable GitHub release tarball.

## Honest current limitation

This is an early project. It does not yet meet mature-package thresholds such as 200,000 monthly downloads, 500 dependent repositories, or 20 external contributors. The strongest application argument is relevance: it directly serves Claude Code users and makes Claude Code safer for maintainers.

## What Claude Max would unlock

Claude Max would be used to:

- Test the hooks in realistic Claude Code sessions.
- Expand dangerous-command and prompt-injection fixtures.
- Keep examples aligned with the latest Claude Code hook contract.
- Review user reports without pushing maintenance cost onto the community.
- Build onboarding docs for maintainers who are new to hooks.
