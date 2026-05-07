import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "AI Spend Audit share preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const report = await prisma.publicReport.findUnique({ where: { slug } });
  const monthly = report ? Number(report.totalMonthlySavings) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg,#050816,#111827 55%,#312e81)",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 26, letterSpacing: "0.18em", opacity: 0.85 }}>CREDEX · AI SPEND AUDIT</div>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.05 }}>
            Modeled savings spotlight
          </div>
          <div style={{ fontSize: 34, opacity: 0.85 }}>
            ~${monthly.toFixed(0)} / month directional upside (benchmarked)
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, opacity: 0.75 }}>Shareable · Founder-safe · No login</div>
          <div style={{ fontSize: 22, opacity: 0.75 }}>aispendaudit.app</div>
        </div>
      </div>
    ),
    size,
  );
}
