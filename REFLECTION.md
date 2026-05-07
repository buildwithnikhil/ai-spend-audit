# Reflection

## 1. Hardest bug
Prisma `Json` columns rejecting strongly typed audit outputs during `next build`. The mismatch between TypeScript interfaces and Prisma’s structural typing for JSON forced an explicit serialization boundary. Lesson: treat persisted snapshots as `unknown → JSON → InputJsonValue`, not as raw classes.

## 2. Reversed decision
Initially considered running the audit engine exclusively on the server for tamper proofing. Pivot: **client-side instant compute** for UX, with server recomputation on persist to keep authoritative numbers aligned with stored payloads.

## 3. Week-2 roadmap
- Add authenticated “workspace” mode for finance teams (still optional).
- Introduce invoice OCR ingest for automatic seat counts.
- Expand pricing dataset editor UI + Git-based approvals.
- Ship downloadable branded PDF via `@react-pdf/renderer`.

## 4. AI usage
Copilot/ChatGPT assisted scaffolding React Hook Form wiring and documentation drafting; **no LLM participates in savings arithmetic**. Claude/OpenAI keys optional for narrative summaries only.

## 5. Self-rating (1–10)
**8/10** — Architecture matches early-stage SaaS expectations (clean separation, observability hooks). Deductions for single-region rate limiting story and lack of automated migration history on first ship.
