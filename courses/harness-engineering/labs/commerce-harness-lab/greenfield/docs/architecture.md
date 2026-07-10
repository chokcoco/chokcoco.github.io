# Minimum architecture

```text
apps/ops-console        React view of reservation state
services/commerce-api   Spring Boot state transitions and API
contracts/              request, response, error, and state examples
specs/                  approved behavior and acceptance cases
scripts/                cross-platform verification entrypoints
state/                  durable task progress and evidence
```

The service owns inventory state. The React application displays state and sends commands; it never calculates available inventory locally. Start with an in-memory repository for learning, but keep the state transition interface separate so a database can replace it later.
