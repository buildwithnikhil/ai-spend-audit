# Devlog (May 2026 build sprint)

## Day 1 — Problem framing & UX spine
Locked the promise: show modeled savings **before** email capture. Sketched Linear-inspired layout tokens (dense typography, soft gradients). Blocker: naming collisions with generic “AI calculator” positioning — resolved by anchoring to Credex negotiation narrative.

## Day 2 — Pricing dataset governance
Mapped required vendors/planes into structured JSON + Zod parsing so typos fail CI tests instead of silently skewing savings. Learning: mixing API SKUs with subscription SKUs requires explicit `usage` model branch.

## Day 3 — Audit engine v1
Implemented bench math + mismatch heuristics (tiny seat counts on team tiers, enterprise bench waste). Hardest edge: enterprise minimum seat modeling — settled on explicit `minBillSeats` metadata.

## Day 4 — Persistence & share URLs
Prisma schema landed with hashed IPs + sanitized public payloads. Built `/api/audit` + `/r/[slug]`. Blocker: JSON typing vs Prisma `Json` fields — resolved via `JSON.parse(JSON.stringify(...))` boundary snapshots.

## Day 5 — Growth instrumentation
PostHog bootstrap + Supabase-style analytics table for backup/server-side correlation. Added honeypot + Upstash rate limiting toggle.

## Day 6 — AI summaries & email
Anthropic-first summarizer with OpenAI fallback + template safety net. Wired Resend transactional template emphasizing share URLs + consult CTA.

## Day 7 — Polish & perf pass
Framer Motion staggers on landing, tightened Lighthouse-sensitive paths (fixed chart container heights for SSR). Shipped Vitest suite + GitHub Actions harness with ephemeral Postgres.
