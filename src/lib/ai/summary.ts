import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AuditEngineResult } from "@/lib/audit-engine";

const FALLBACK =
  "Your audit highlights overlapping AI subscriptions relative to modeled benchmarks. Prioritize seat rationalization on team SKUs, validate enterprise tiers against headcount, and route predictable workloads off premium API meters where subscriptions bundle sufficient throughput.";

function buildPrompt(result: AuditEngineResult, context: { teamSize: number; stage: string; useCase: string }) {
  const lines = [
    `Team context: ${context.teamSize} people, stage ${context.stage}, primary use ${context.useCase}.`,
    `Totals: $${result.totalMonthlySpend}/mo spend, estimated $${result.totalMonthlySavings}/mo savings.`,
    `Scores: optimization ${result.optimizationScore}/100, efficiency ${result.efficiencyScore}/100.`,
    "Tool findings:",
    ...result.tools.map(
      (t) =>
        `- ${t.vendorName}: ${t.currentPlanLabel} → ${t.recommendedPlanLabel}; ~$${t.monthlySavings}/mo; ${t.reasoning}`,
    ),
    "Write a concise executive summary (~100 words) for a founder CFO. No markdown. Tone: trusted advisor.",
  ];
  return lines.join("\n");
}

async function withRetries<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw last;
}

export type SummarySource = "gemini" | "anthropic" | "openai" | "fallback";

export async function generateExecutiveSummary(args: {
  result: AuditEngineResult;
  teamSize: number;
  companyStage: string;
  useCase: string;
}): Promise<{ summary: string; source: SummarySource }> {
  const prompt = buildPrompt(args.result, {
    teamSize: args.teamSize,
    stage: args.companyStage,
    useCase: args.useCase,
  });

  /** Google AI Studio key — free tier quota applies (see https://ai.google.dev/pricing) */
  const geminiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  const geminiModelId =
    process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: geminiModelId,
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.45,
        },
      });
      const out = await withRetries(() => model.generateContent(prompt));
      const text = out.response.text()?.trim();
      if (text) return { summary: text, source: "gemini" };
    } catch {
      /* fall through */
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const msg = await withRetries(() =>
        client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 220,
          messages: [{ role: "user", content: prompt }],
        }),
      );
      const text = msg.content.find((b) => b.type === "text");
      if (text && text.type === "text") {
        return { summary: text.text.trim(), source: "anthropic" };
      }
    } catch {
      /* fall through */
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const completion = await withRetries(() =>
        client.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 220,
          messages: [{ role: "user", content: prompt }],
        }),
      );
      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return { summary: content, source: "openai" };
    } catch {
      /* fall through */
    }
  }

  return { summary: FALLBACK, source: "fallback" };
}
