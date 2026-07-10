# Promotion stacking task contract

Status: approved  
Updated: 2026-07-10

## Objective

Make storefront preview and backend quote apply the same explicit combination policy and return an explainable price breakdown.

## Scope

- `starter/packages/promotion-engine/`
- `starter/apps/storefront/`
- pricing records and tests in `starter/services/commerce-api/`

## Invariants

- Store and calculate money as integer cents.
- Sale items do not receive the member product discount.
- `allowMemberWithOrderCoupon=false` disables the order coupon when a member product discount was applied.
- Shipping discounts remain independent unless a later policy says otherwise.
- Never make the browser implementation the authoritative order price.

## Acceptance cases

| Case | Member | Sale item | Order coupon | Combination allowed | Expected payable |
| --- | --- | --- | --- | --- | ---: |
| P1 | yes | no | ORDER50 | yes | 66820 |
| P2 | yes | no | ORDER50 | no | 73020 |
| P3 | yes | yes | none | yes | 81000 |

## Stop conditions

- The frontend and backend policy schemas cannot be made compatible without changing a public API.
- A shared-package change affects a consumer outside the listed scope.
- A monetary result differs between JavaScript and Java acceptance cases.
