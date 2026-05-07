# Tests

## Runner

```bash
npm run test        # vitest run
npm run typecheck   # tsc --noEmit
```

## Audit engine suite (`src/lib/audit-engine/engine.test.ts`)

| Test | Intent |
| --- | --- |
| `estimatePlanMonthlyUsd` per-seat math | Validates multiplication against declared seats |
| Enterprise bench respects `minBillSeats` | Guards understated enterprise modeling |
| Overspend vs modeled list pricing | Ensures savings triggers when invoices exceed bench |
| Enterprise SKU mismatch | Confirms downgrade pathway when headcount tiny |
| Multi-tool aggregation | Checks totals + score bounding |
| Pure usage SKUs | Regression guard — usage branch must not throw |

## Not covered (intentional MVP gaps)

- Playwright E2E (optional per brief) — add once preview URLs stable.
- Snapshot tests for marketing pages (high churn).

## CI

`.github/workflows/ci.yml` runs Vitest on every push/PR against ephemeral Postgres to guarantee Prisma schema compatibility.
