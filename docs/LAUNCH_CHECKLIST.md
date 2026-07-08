# Launch checklist

This file tracks the public launch state.

## Repo setup

- [x] Create public repo as `claude-agent-guardrails`.
- [x] Create public GitHub repo under Adam's account.
- [x] Push local repo.
- [x] Confirm default branch is `main`.
- [x] Confirm CI badge resolves.
- [x] Add repository topics: `claude-code`, `claude`, `hooks`, `ai-agents`, `guardrails`, `agent-safety`, `typescript`.

## npm setup

- [ ] Confirm package name is still available: `npm view claude-agent-guardrails`.
- [ ] Log into npm. Blocked until Adam signs in with `npm adduser`.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
- [ ] Run `npm run pack:dry`.
- [ ] Publish with `npm publish --access public`.
- [ ] Confirm `npx claude-agent-guardrails` installs into a throwaway project.
- [x] Attach installable npm tarball to GitHub release as the interim install path.
- [x] Smoke-test release tarball install in a throwaway project.

## Trust signals

- [ ] Add demo GIF to README.
- [x] Add OpenSSF Scorecard badge after public repo exists.
- [x] Add branch protection for `main`.
- [x] Enable GitHub private vulnerability reporting.
- [x] Open 10 beginner-friendly issues.
- [ ] Ask three developers to try install and open one issue or PR.

## Claude OSS application

- [ ] Fill form with GitHub account email.
- [ ] Select the new public repo.
- [ ] Paste `docs/OSS_APPLICATION_DRAFT.md` answers.
- [ ] Include npm and CI receipts.
- [ ] Say plainly that this is early, but highly relevant to Claude Code maintainers.
