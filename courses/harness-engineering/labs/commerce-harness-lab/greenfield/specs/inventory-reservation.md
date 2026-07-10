# Inventory reservation starter contract

- Reserve for 15 minutes.
- Repeating an identical idempotency key returns the first result.
- Reusing a key for different intent is rejected.
- Claim and release are terminal, idempotent operations.
- Every state change produces an audit event.
- The first version does not implement distributed locks or a production payment callback.
