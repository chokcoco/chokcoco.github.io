# Architecture boundaries

```text
apps/storefront ─┐
                 ├──> packages/promotion-engine
apps/ops-console ┘

apps/* ──HTTP contract──> services/commerce-api
```

Rules:

- Browser applications may depend on shared browser-safe packages.
- Browser applications must not import Java source, service configuration, secrets, or server-only fixtures.
- `promotion-engine` contains deterministic price calculation and no network access.
- `commerce-api` owns authoritative quote and inventory state transitions.
- Cross-boundary changes require a contract test and a notice in the task plan.
- Amounts use integer cents. Timestamps use UTC instants at service boundaries.
