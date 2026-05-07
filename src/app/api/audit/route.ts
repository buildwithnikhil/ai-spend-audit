import { NextResponse } from "next/server";
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { auditFromInput } from "@/lib/audit-engine";
import { toSanitizedPublicPayload } from "@/lib/audit/public-payload";
import { prisma } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";
import { auditSubmissionSchema } from "@/lib/validations/audit";

export const runtime = "nodejs";

function appOrigin(req: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000"
  );
}

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") ?? "anon";
  const ipKey = createHash("sha256").update(forwarded).digest("hex").slice(0, 24);
  const allowed = await allowRequest("audit", ipKey, 40);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json: unknown = await req.json();
  const parsed = auditSubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = {
    tools: parsed.data.tools.map((t) => ({
      vendorId: t.vendorId,
      planId: t.planId,
      monthlySpend: t.monthlySpend,
      seats: t.seats,
    })),
    teamSize: parsed.data.teamSize,
    companyStage: parsed.data.companyStage,
    useCase: parsed.data.useCase,
  };

  const result = auditFromInput(input);
  const slug = nanoid(12);
  const sanitized = toSanitizedPublicPayload(result);
  const origin = appOrigin(req);

  try {
    const audit = await prisma.audit.create({
      data: {
        teamSize: parsed.data.teamSize,
        companyStage: parsed.data.companyStage,
        useCase: parsed.data.useCase,
        totalMonthlySpend: result.totalMonthlySpend,
        totalMonthlySavings: result.totalMonthlySavings,
        totalAnnualSavings: result.totalAnnualSavings,
        optimizationScore: result.optimizationScore,
        efficiencyScore: result.efficiencyScore,
        rawInput: JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonValue,
        rawOutput: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
        sessionId: parsed.data.sessionId,
        ipHash: ipKey,
        userAgent: req.headers.get("user-agent"),
        referrer: req.headers.get("referer"),
        tools: {
          create: result.tools.map((t) => {
            const row = parsed.data.tools.find((x) => x.vendorId === t.vendorId);
            return {
              vendorId: t.vendorId,
              planId: t.currentPlanId,
              seats: row?.seats ?? 1,
              monthlySpend: t.currentMonthlySpend,
              recommendedPlanId: t.recommendedPlanId,
              monthlySavings: t.monthlySavings,
              annualSavings: t.annualSavings,
              reasoning: t.reasoning,
            };
          }),
        },
        publicReport: {
          create: {
            slug,
            sanitizedPayload: JSON.parse(JSON.stringify(sanitized)) as Prisma.InputJsonValue,
            totalMonthlySavings: result.totalMonthlySavings,
            totalAnnualSavings: result.totalAnnualSavings,
            optimizationScore: result.optimizationScore,
          },
        },
      },
      include: { publicReport: true },
    });

    const shareUrl = `${origin.replace(/\/$/, "")}/r/${audit.publicReport!.slug}`;

    return NextResponse.json({
      auditId: audit.id,
      slug: audit.publicReport!.slug,
      shareUrl,
      result,
    });
  } catch (e) {
    console.error(e);
    const shareUrl = `${origin.replace(/\/$/, "")}/r/${slug}`;
    return NextResponse.json(
      {
        error: "persist_failed",
        message:
          "Could not persist audit (database unavailable). Results are still valid client-side.",
        slug,
        shareUrl,
        result,
      },
      { status: 503 },
    );
  }
}
