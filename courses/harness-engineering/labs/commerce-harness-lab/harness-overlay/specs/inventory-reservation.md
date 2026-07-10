# Inventory reservation task contract

Status: approved  
Updated: 2026-07-10

## Objective

Reserve stock for 15 minutes before payment, make retries safe with an idempotency key, and support claim, cancel, and expiry without double-changing inventory.

## State model

```text
AVAILABLE -> RESERVED -> CLAIMED
                    \-> RELEASED
```

## Invariants

- The same idempotency key and request body return the first result.
- The same key with different SKU or quantity returns `IDEMPOTENCY_CONFLICT`.
- Claim and release are terminal and idempotent.
- Insufficient stock leaves no partial reservation.
- Every transition records reservation id, operation, prior state, next state, reason, and timestamp.

## Acceptance cases

| Case | Action | Expected result |
| --- | --- | --- |
| I1 | reserve the same request twice | same reservation id; available decreases once |
| I2 | reuse key with different quantity | conflict; inventory unchanged |
| I3 | claim twice | second call returns existing claimed result |
| I4 | release twice | second call returns existing released result |
| I5 | reserve more than available | rejected; no partial record |

## Human gates

Changing ledger semantics, expiry duration, multi-location allocation, or payment callback behavior requires approval.
