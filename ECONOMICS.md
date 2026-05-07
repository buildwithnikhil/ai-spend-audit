# Economics (illustrative model)

Assumptions:

- **Traffic:** 10,000 landing sessions / month from organic + launches.
- **Audit completion rate:** 35% → 3,500 audits.
- **Share URL CTR:** 15% among completers → 525 viral exposures (secondary viral coefficient 0.05 ignored for simplicity).
- **Lead capture rate:** 12% of completers → **420 leads/mo**.
- **Consultation booking rate:** 8% of leads → **34 booked calls/mo**.
- **Close rate on consult:** 25% → **8.5 new Credex engagements/mo**.

### CAC rough-cut

| Channel mix | Blended CPC / equivalent | Notes |
| --- | --- | --- |
| Organic-first launch | **$45–$120** | Time-heavy but low cash burn |
| Paid retargeting later | **$180–$260** | Target finance keywords long-tail |

Using organic-heavy blend → assume **$95 CAC** per consulting opportunity.

### Consult revenue math

- Average consulting engagement: **$18,000** project fee (modeling + negotiation support).
- Gross margin after contractor bench (research + analyst): **65%**.

Monthly consulting contribution:

`8.5 deals × $18,000 × 65% ≈ $99,450 gross contribution`

Variable infrastructure (Vercel + Neon + PostHog + email):

~**$850/mo** at described scale → negligible vs consulting upside.

### ARR projection (consulting-led)

If monthly velocity stabilizes:

`8.5 deals × $18,000 × 12 ≈ $1.836M annual consulting GMV`

Margin-adjusted (~65%) → **~$1.19M contribution ARR equivalent**.

> Swap engagement pricing for retained audits (MRR) once dataset confidence hits enterprise bar — move multiplier from services → software gross margin profile.
