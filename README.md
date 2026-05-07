# AI Spend Audit

Production-style MVP for Credex: **rule-based** benchmarking of AI subscriptions (Cursor, GitHub Copilot, Claude, ChatGPT, Gemini, Windsurf, major APIs) against a **versioned pricing dataset**, with **shareable reports**, **lead capture**, **Resend email**, optional **LLM executive summaries**, and **PostHog** analytics.

Screenshots: add PNGs under `docs/screenshots/` (hero, wizard, results, public share) when available.

## Features

- SaaS landing page (hero, social proof, pain, chart, testimonials, FAQ, CTA) with dark/light mode.
- Multi-step audit wizard: per-tool plan + spend + seats, team context, autosave (`localStorage` + URL params).
- Deterministic audit engine (pricing JSON separated from rules); Vitest coverage for savings math & edge cases.
- Results hero with optimization + efficiency scores, per-tool cards, dynamic Credex CTAs (>$500/mo vs <$100/mo honesty path).
- Background persistence (`POST /api/audit`) → Prisma models → unique `/r/[slug]` public page with OG image route.
- Email capture + honeypot + optional Upstash Redis sliding-window limits.
- AI summary (`POST /api/summary`) prefers **Google Gemini** (Google AI Studio free tier), then Claude Haiku, then OpenAI `gpt-4o-mini`, then a deterministic template.
- SEO: metadata, canonical, OG/Twitter, JSON-LD, `robots.txt`, `sitemap.xml`.

## Tech stack

Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Prisma 6 · PostgreSQL · Zod · React Hook Form · Framer Motion · Zustand-free stores (local/session storage + hooks) · PostHog · Resend · Upstash Ratelimit · Vitest.

## Getting started

```bash
cp .env.example .env
# Set DATABASE_URL to your Postgres instance
npm install
npx prisma db push   # or migrate when you add migrations
npm run dev
```

Visit `http://localhost:3000`.

### Required env vars

See [.env.example](.env.example). Minimum for full flows:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY` + verified `RESEND_FROM` domain for outbound mail

Optional:

- `GEMINI_API_KEY` (Google AI Studio — **recommended** for executive summary free tier; optional `GEMINI_MODEL`, default `gemini-2.0-flash`)
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` (fallback summarizers)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest |

## Deployment (Vercel)

1. Create Postgres (Neon, Supabase, RDS) → copy connection string to `DATABASE_URL`.
2. Set env vars in Vercel project settings (`NEXT_PUBLIC_APP_URL` must match prod domain).
3. Run `npx prisma db push` once against prod DB (or adopt migrations for stricter control).
4. Deploy; confirm `/api/audit` writes succeed and `/r/[slug]` resolves.

## Architecture overview

See [ARCHITECTURE.md](ARCHITECTURE.md) for diagrams, scaling notes (10k audits/day), and abuse-protection rationale.

## Documentation map

| File | Contents |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & scaling |
| [DEVLOG.md](DEVLOG.md) | 7-day implementation narrative |
| [REFLECTION.md](REFLECTION.md) | Retro / roadmap |
| [TESTS.md](TESTS.md) | Testing philosophy & inventory |
| [PRICING_DATA.md](PRICING_DATA.md) | Bench pricing table & sources |
| [PROMPTS.md](PROMPTS.md) | Executive-summary prompts |
| [GTM.md](GTM.md) | Go-to-market playbook |
| [ECONOMICS.md](ECONOMICS.md) | Unit economics math |
| [USER_INTERVIEWS.md](USER_INTERVIEWS.md) | Qualitative research snippets |
| [LANDING_COPY.md](LANDING_COPY.md) | Marketing copy reference |
| [METRICS.md](METRICS.md) | Analytics taxonomy |

## Trade-offs shipped deliberately

- **Rule-based savings:** Transparent & investor-safe vs black-box ML spend forecasting.
- **Prisma JSON columns:** Fast iteration for audit payloads vs normalized recommendation tables.
- **Optional Redis limits:** Dev ergonomics; prod should configure Upstash for horizontal fairness.
- **Client-first audit:** Instant UX with tamper-aware server recompute on persist.

## Security & privacy

- Public reports intentionally omit email + company fields from lead capture.
- IP addresses hashed before persistence (`sha256` truncated).
- Honeypot field (`website`) rejects noisy bots silently.

## License

Private / proprietary — Credex assignment baseline.
