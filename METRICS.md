# Metrics & analytics

## North-star metric

**Qualified audits completed/week** — definition: user reaches results view with ≥2 tools and persists slug successfully.

## Event taxonomy

| Event | Source | Notes |
| --- | --- | --- |
| `audit_started` | PostHog + `AnalyticsEvent` | Wizard mount |
| `audit_completed` | Server analytics row | Successful `/api/audit` |
| `audit_completed_local` | PostHog (client) | Instant UX milestone |
| `audit_persisted` | PostHog | Boolean flag for DB health |
| `share_copy_clicked` | PostHog | Virality proxy |
| `email_captured` | PostHog | Lead form success |
| `consultation_cta_clicked` | PostHog | High-intent proxy |

## Funnel stages

1. Landing session  
2. Wizard start  
3. Local completion  
4. Persisted audit (slug minted)  
5. Lead submitted  

Target instrumentation drift <5% between PostHog & DB counts — discrepancies indicate ad-blockers or sampling.

## Dashboards (recommended)

- PostHog funnel: Landing → Audit started → Email captured  
- SQL slice: savings tier histogram (`high` vs `low`) vs consult CTA CTR  

## Abuse observability

Monitor **429 rate** per route (`/api/audit`, `/api/leads`) + honeypot trip ratio (should hover ~0 outside attacks).
