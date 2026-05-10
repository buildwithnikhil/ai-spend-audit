import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase";
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
  const supabase = getSupabaseServerClient();

  try {
    const { data: audit } = await supabase
      .from("Audit")
      .select("id,totalMonthlySavings,totalAnnualSavings")
      .eq("id", parsed.data.auditId)
      .maybeSingle();
    const { data: publicReport } = await supabase
      .from("PublicReport")
      .select("slug")
      .eq("auditId", parsed.data.auditId)
      .maybeSingle();
    const { data: tools } = await supabase
      .from("AuditTool")
      .select("vendorId,monthlySavings")
      .eq("auditId", parsed.data.auditId)
      .limit(3);

    const resolvedShareUrl = publicReport?.slug
      ? `${origin.replace(/\/$/, "")}/r/${publicReport.slug}`
      : `${origin.replace(/\/$/, "")}/audit/results`;

    const { error: leadError } = await supabase.from("UserLead").insert({
        email: parsed.data.email,
        company: parsed.data.company,
        role: parsed.data.role,
        teamSize: parsed.data.teamSize,
        auditId: parsed.data.auditId,
        referralSource: parsed.data.referralSource,
        utm: parsed.data.utm ?? undefined,
        honeypotFilled: false,
    });
    if (leadError) throw leadError;

    const monthly =
      audit?.totalMonthlySavings != null ? Number(audit.totalMonthlySavings) : 0;
    const annual = audit?.totalAnnualSavings != null ? Number(audit.totalAnnualSavings) : 0;
    const highlights =
      tools?.map((t) => `${t.vendorId}: save ~$${Number(t.monthlySavings)}/mo`) ??
      [];

    await sendAuditLeadEmail({
      to: parsed.data.email,
      shareUrl: resolvedShareUrl,
      monthlySavings: monthly,
      annualSavings: annual,
      highlights: highlights.length ? highlights : ["Review recommendations inside your shareable report."],
    });

    return NextResponse.json({ ok: true, shareUrl: resolvedShareUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "lead_failed" }, { status: 500 });
  }
}
