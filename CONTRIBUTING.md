# Contributing

Thanks for helping make Claude Code safer for autonomous work.

## Good first issues

The best first contribution is a small fixture:

- A command that should be denied.
- A command that should ask for operator approval.
- A command that should be allowed.
- A prompt-injection payload that should warn, ask, or deny.
- A cost rule that models a real agent workflow.

## Development

```bash
npm install
npm run check
npm run build
```

## Pull request checklist

- Add or update tests.
- Keep hook entrypoints thin.
- Put policy logic in `src/core/`.
- Update README or docs when behavior changes.
- Run `npm run check` before opening the PR.

## Design rule

Hooks should fail open only when the input cannot be parsed. A recognized risky action should produce an explicit `deny`, `ask`, or `warn` decision.
