import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PrintSaveButton } from "@/components/print-save-button";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = { slug: string };

export const revalidate = 120;
export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await props.params;
  const report = await prisma.publicReport.findUnique({ where: { slug } });
  if (!report) {
    return { title: "Report not found · AI Spend Audit" };
  }
  const monthly = Number(report.totalMonthlySavings);
  const title = `~$${monthly.toFixed(0)}/mo modeled savings · AI Spend Audit`;
  const description =
    "Anonymous, share-friendly AI spend breakdown — Credex benchmarks subscriptions vs. modeled pricing.";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base}/r/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "AI Spend Audit",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicReportPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const report = await prisma.publicReport.findUnique({ where: { slug } });
  if (!report) notFound();

  const payload = report.sanitizedPayload as {
    tools: Array<{
      vendorName: string;
      currentPlanLabel: string;
      recommendedPlanLabel: string;
      monthlySavings: number;
      reasoning: string;
    }>;
    totals: {
      monthlySpend: number;
      monthlySavings: number;
      annualSavings: number;
      optimizationScore: number;
      efficiencyScore: number;
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-indigo-500/15 via-background to-background p-8 shadow-lg shadow-indigo-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Shareable report
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Modeled savings · ${payload.totals.monthlySavings.toFixed(0)}/mo
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Public summary excludes emails and company notes. Numbers are directional benchmarks — not
            contractual advice.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/audit" className={cn(buttonVariants({ size: "lg" }))}>
              Run your own audit
            </Link>
            <PrintSaveButton />
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly modeled uplift</CardDescription>
              <CardTitle className="text-3xl">${payload.totals.monthlySavings.toFixed(0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Annualized</CardDescription>
              <CardTitle className="text-3xl">${payload.totals.annualSavings.toFixed(0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Optimization score</CardDescription>
              <CardTitle className="text-3xl">{payload.totals.optimizationScore}/100</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Breakdown</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {payload.tools.map((t) => (
              <Card key={`${t.vendorName}-${t.currentPlanLabel}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.vendorName}</CardTitle>
                  <CardDescription>
                    {t.currentPlanLabel} → {t.recommendedPlanLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold text-emerald-500">
                    ~${t.monthlySavings.toFixed(0)}/mo modeled savings
                  </p>
                  <p className="text-muted-foreground">{t.reasoning}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border-indigo-500/30 bg-indigo-500/5">
          <CardHeader>
            <CardTitle>Want negotiation support?</CardTitle>
            <CardDescription>
              Credex compresses renewal cycles and aligns SKUs to actual workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={process.env.NEXT_PUBLIC_CAL_BOOKING_URL ?? "https://cal.com"}
              className={cn(buttonVariants({ size: "default" }))}
            >
              Book consult
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
