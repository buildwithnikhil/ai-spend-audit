import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { analyticsEventSchema } from "@/lib/validations/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  const json: unknown = await req.json();
  const parsed = analyticsEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("AnalyticsEvent").insert({
        eventType: parsed.data.eventType,
        payload: parsed.data.payload,
        sessionId: parsed.data.sessionId,
        auditId: parsed.data.auditId,
        path: parsed.data.path,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
