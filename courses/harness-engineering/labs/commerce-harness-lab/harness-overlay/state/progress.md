# Progress

Updated: 2026-07-10T00:00:00Z

## Confirmed

- Promotion and inventory task contracts are approved.
- The starter repository contains intentional failures for combination policy and idempotent reservation.

## Completed

- Repository map and architecture boundaries created.
- Deterministic overlay verification created.

## Next safe action

Run the starter tests and capture the two expected failures before changing implementation.

## Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `node scripts/verify-overlay.mjs` | pending | run from `harness-overlay/` |

## Open risks

- Java tests require Java 21 and Maven.
- The course lab uses in-memory storage and does not prove production concurrency behavior.
