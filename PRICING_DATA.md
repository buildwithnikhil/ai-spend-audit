# Pricing data (`src/data/pricing.json`)

Dataset version: **1.0.0** · Effective **2026-05-01** · Currency **USD**

> Values are **benchmark anchors** for modeled savings — always reconcile against your order form / MSA. Official pages fluctuate; bump `version` + `verificationDate` when you refresh numbers.

| Vendor | Plan highlights | Official pricing URL | Verification date |
| --- | --- | --- | --- |
| Cursor | Hobby / Pro / Business / Enterprise bench | https://cursor.com/pricing | 2026-05-01 |
| GitHub Copilot | Individual / Business / Enterprise bench | https://github.com/features/copilot/plans | 2026-05-01 |
| Claude (consumer) | Free / Pro / Max / Team / Enterprise bench / API usage | https://www.anthropic.com/pricing | 2026-05-01 |
| ChatGPT | Plus / Team / Enterprise bench / API usage | https://openai.com/chatgpt/pricing/ | 2026-05-01 |
| Anthropic API | PAYG / committed (usage) | https://www.anthropic.com/pricing#api | 2026-05-01 |
| OpenAI API | PAYG / committed (usage) | https://openai.com/pricing | 2026-05-01 |
| Google Gemini | AI Pro / Ultra / API usage | https://ai.google.dev/pricing | 2026-05-01 |
| Windsurf | Free / Pro / Teams / Enterprise bench | https://windsurf.com/pricing | 2026-05-01 |

## Modeling notes

- **Per-seat** SKUs multiply bench USD × declared seats (minimum 1 seat).
- **Enterprise bench** uses annotated `benchPerSeatUsd` + `minBillSeats` to avoid underestimating committed buys while still surfacing waste when teams undershoot mins.
- **Usage SKUs** intentionally skip fixed benches — engine applies qualitative leakage rules (−15% illustrative savings cap) and prompts operational optimizations instead of fake precision.

## Change management

1. Edit JSON → run `npm run test` (bench regressions) → update this table’s verification dates.
2. Optionally insert historical rows into `PricingSource` via Prisma seed script for audit trails.
