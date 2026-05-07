import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { analyticsEventSchema } from "@/lib/validations/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json: unknown = await req.json();
  const parsed = analyticsEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: parsed.data.eventType,
        payload: parsed.data.payload as Prisma.InputJsonValue | undefined,
        sessionId: parsed.data.sessionId,
        auditId: parsed.data.auditId,
        path: parsed.data.path,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
