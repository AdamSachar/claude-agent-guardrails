# Policy deny-list hardening, measured

Date: 2026-07-31. Method: a 28-command red-team battery run directly against
`evaluateCommand()` using the shipped `guardrails.config.json`, before and
after tightening the deny patterns. Reproduce with the regression suite:

```bash
npx vitest run src/core/policy.shipped.test.ts
```

## What the red-team found

The original deny-list caught the textbook forms (`rm -rf /`, `cat ~/.ssh/id_rsa`,
`curl … | bash`) but let trivial variants through as **allow**:

| Bypass | Why it slipped | Now |
|---|---|---|
| `rm -fr /` | flag order swapped; pattern hard-coded `-rf` | deny |
| `rm --recursive --force /` | long flags not covered | deny |
| `find / -delete` | no rule for `find` at all | deny |
| `cat ./.env.production` | `.env` rule required end-of-token | deny |
| `git push -f origin main` | force rule matched only `--force` | deny |
| `dd of=/dev/sda if=/dev/zero` | rule assumed `if=` before `of=` | deny |
| `bash -c "rm -rf ~"` | quote after target broke the boundary | deny |

## Measured result

| Metric | Before | After |
|---|---:|---:|
| Dangerous commands in battery | 24 | 24 |
| Denied outright | 15 | 24 |
| Denied or escalated to "ask" | 18 | 24 |
| **Reached "allow" (true misses)** | **6** | **0** |
| Benign commands wrongly blocked | 0 | 0 |

The three benign controls (`ls -la`, `git status`, `npm test`) stay allowed.
`rm -rf ./build` still escalates to "ask", which is intended: an agent should
confirm any recursive delete, even a local one.

## What changed

`guardrails.config.json` `policy.denyPatterns` only. The three `rm` rules now
tolerate combined or separated short flags in either order, long `--recursive`/
`--force` flags, and a target followed by whitespace, end, glob, or a closing
quote/paren. Added a root-scoped `find … -delete|-exec` rule and an
order-independent `dd … of=/dev/` rule. The force-push rule uses lookaheads so
branch and force flag can appear in any order and `-f` counts. The `.env` rule
accepts a dotted suffix.

No hook code changed, so the fix ships to every installed project the moment
its config is regenerated, and existing installs can copy the new patterns
without upgrading the package.

## Regression lock

`src/core/policy.shipped.test.ts` runs the full battery against the real
shipped config on every `npm test`. Suite went from 47 to 70 tests. Adding a
destructive command that is not denied here is treated as a security
regression.
