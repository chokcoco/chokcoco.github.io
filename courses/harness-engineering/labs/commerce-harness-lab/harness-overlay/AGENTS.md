# Starbridge Commerce instructions

Start with `docs/index.md`. Load only the module and task documents needed for the current change.

## Default validation

```bash
node scripts/verify-overlay.mjs
node --test ../starter/packages/promotion-engine/test/*.test.js
```

For React changes, run the workspace build from `starter/`. For Java changes, run `mvn test` from `starter/services/commerce-api/`.

## Boundaries

- Allowed by default: task specs, tests, and code inside the named application or service.
- Notice required: `packages/promotion-engine`, public API records, shared fixtures, or more than one application.
- Approval required: dependency upgrades, authentication, payment callbacks, inventory ledger semantics, CI, or destructive data operations.
- Blocked: production credentials, real customer data, bypassing tests, weakening assertions, or editing generated output.

Finish only when the task acceptance cases pass and `state/progress.md` records commands, results, remaining risks, and the next safe action.
