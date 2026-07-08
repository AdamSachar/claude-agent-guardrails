# Security Policy

## Supported versions

Security fixes target the latest published version.

## Reporting a vulnerability

Please open a private GitHub security advisory when the repository is public.

Until then, contact Adam Sacharowitz through the GitHub profile linked from the repository.

## Scope

Relevant reports include:

- Destructive commands that should be denied but are allowed.
- Secret exfiltration commands that are missed.
- Prompt-injection payloads that bypass the injection guard.
- Hook protocol bugs that produce the wrong Claude Code decision.
- Installer behavior that corrupts `.claude/settings.json`.

Out of scope:

- Requests to bypass guardrails.
- Reports that require access to private keys, tokens, or accounts.
- Policy disagreements without a reproducible payload.
