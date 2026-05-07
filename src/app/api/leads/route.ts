import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { sendAuditLeadEmail } from "@/lib/email/resend";
import { allowRequest } from "@/lib/rate-limit";
import { leadSubmissionSchema } from "@/lib/validations/audit";

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
  const allowed = await allowRequest("lead", ipKey, 25);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json: unknown = await req.json();
  const parsed = leadSubmissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const origin = appOrigin(req);

  try {
    const audit = await prisma.audit.findUnique({
      where: { id: parsed.data.auditId },
      include: { publicReport: true, tools: true },
    });

    const shareUrl = audit?.publicReport?.slug
      ? `${origin.replace(/\/$/, "")}/r/${audit.publicReport.slug}`
      : `${origin.replace(/\/$/, "")}/audit/results`;

    await prisma.userLead.create({
      data: {
        email: parsed.data.email,
        company: parsed.data.company,
        role: parsed.data.role,
        teamSize: parsed.data.teamSize,
        auditId: parsed.data.auditId,
        referralSource: parsed.data.referralSource,
        utm: parsed.data.utm ?? undefined,
        honeypotFilled: false,
      },
    });

    const monthly =
      audit?.totalMonthlySavings != null ? Number(audit.totalMonthlySavings) : 0;
    const annual = audit?.totalAnnualSavings != null ? Number(audit.totalAnnualSavings) : 0;
    const highlights =
      audit?.tools.slice(0, 3).map((t) => `${t.vendorId}: save ~$${Number(t.monthlySavings)}/mo`) ??
      [];

    await sendAuditLeadEmail({
      to: parsed.data.email,
      shareUrl,
      monthlySavings: monthly,
      annualSavings: annual,
      highlights: highlights.length ? highlights : ["Review recommendations inside your shareable report."],
    });

    return NextResponse.json({ ok: true, shareUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "lead_failed" }, { status: 500 });
  }
}
