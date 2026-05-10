import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { generateExecutiveSummary } from "@/lib/ai/summary";
import type { AuditEngineResult } from "@/lib/audit-engine";
import { getSupabaseServerClient } from "@/lib/supabase";
import { allowRequest } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  auditId: z.string().optional(),
  teamSize: z.number().int().positive(),
  companyStage: z.string(),
  useCase: z.string(),
  result: z.unknown(),
});

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  const forwarded = req.headers.get("x-forwarded-for") ?? "anon";
  const ipKey = createHash("sha256").update(forwarded).digest("hex").slice(0, 24);
  const allowed = await allowRequest("summary", ipKey, 60);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json: unknown = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { summary, source } = await generateExecutiveSummary({
    result: parsed.data.result as AuditEngineResult,
    teamSize: parsed.data.teamSize,
    companyStage: parsed.data.companyStage,
    useCase: parsed.data.useCase,
  });

  if (parsed.data.auditId) {
    try {
      await supabase.from("Audit").update({ aiSummary: summary }).eq("id", parsed.data.auditId);
    } catch {
      /* ignore persistence failures */
    }
  }

  return NextResponse.json({ summary, source });
}
