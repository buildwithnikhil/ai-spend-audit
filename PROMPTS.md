# PROMPTS — Executive summary (`src/lib/ai/summary.ts`)

## Final prompt (production)

```
Team context: {teamSize} people, stage {companyStage}, primary use {useCase}.
Totals: ${totalMonthlySpend}/mo spend, estimated ${totalMonthlySavings}/mo savings.
Scores: optimization {optimizationScore}/100, efficiency {efficiencyScore}/100.
Tool findings:
- {vendor}: {currentPlan} → {recommendedPlan}; ~${monthlySavings}/mo; {reasoning}
...

Write a concise executive summary (~100 words) for a founder CFO. No markdown. Tone: trusted advisor.
```

## Models (priority order)

1. **Primary:** **Google Gemini** via `@google/generative-ai` — uses **`GEMINI_API_KEY`** (or **`GOOGLE_GENERATIVE_AI_API_KEY`**) from [Google AI Studio](https://aistudio.google.com/) free-tier quota. Default model **`gemini-2.0-flash`** (override with **`GEMINI_MODEL`**).
2. **Fallback:** Anthropic `claude-3-5-haiku-20241022` (`ANTHROPIC_API_KEY`).
3. **Fallback:** OpenAI `gpt-4o-mini` (`OPENAI_API_KEY`).
4. **Hard fallback:** deterministic template string (always succeeds offline).

## Attempt log (what did *not* ship)

| Attempt | Issue |
| --- | --- |
| Single mega-prompt asking model to recalc savings | Violates “no AI arithmetic” rule & introduces hallucinated dollars |
| JSON-mode responses | Added parsing fragility without improving copy quality |
| Claude Sonnet default | Higher quality but unnecessary latency + cost for a 100-word blurb |

## Reasoning

Founders trust outputs tied to **explainable line items**. Keeping numerics deterministic preserves investor diligence while still letting LLMs polish narrative glue (themes, urgency, sequencing). Gemini’s generous free tier fits founder tooling without metering anxiety.

## Retry strategy

- Two retries with linear backoff (250ms × attempt).
- Fail-open to template summary so UI skeleton resolves instantly.
