"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  BarChart3,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const BeforeAfterChart = dynamic(
  () => import("./before-after-chart").then((m) => m.BeforeAfterChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse rounded-xl bg-muted/40" /> },
);

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),transparent_55%),radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_40%)]" />
      <SiteHeader />
      <main>
        <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-14 lg:flex-row lg:items-center lg:justify-between">
          <motion.div {...fadeUp} transition={{ duration: 0.45 }} className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-indigo-500" aria-hidden />
              Free audit · No login · Credex-grade benchmarks
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find the leaks in your AI stack before your renewal hits.
            </h1>
            <p className="text-lg text-muted-foreground">
              AI Spend Audit models Cursor, Copilot, Claude, ChatGPT, Gemini, Windsurf, and major APIs
              against versioned pricing datasets — then shows savings, reasoning, and a shareable link.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/audit" className={cn(buttonVariants({ size: "lg" }))}>
                Run spend audit
              </Link>
              <a
                href="#how-it-works"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                See how it works
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" aria-hidden />
                SOC-minded defaults · telemetry optional
              </div>
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-indigo-400" aria-hidden />
                Public shares strip PII automatically
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="relative w-full max-w-lg rounded-3xl border border-border/70 bg-card/70 p-6 shadow-2xl shadow-indigo-500/15 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Live preview
                </p>
                <p className="text-lg font-semibold">Benchmark envelope</p>
              </div>
              <Radar className="size-6 text-indigo-400" aria-hidden />
            </div>
            <Separator className="my-5" />
            <div className="grid gap-4 text-sm">
              <Row label="Seat mismatch risk" value="Medium" tone="amber" />
              <Row label="Enterprise SKU fit" value="Review" tone="rose" />
              <Row label="API leakage" value="Optimize routing" tone="sky" />
            </div>
            <Separator className="my-5" />
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500/15 to-sky-500/10 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Modeled monthly savings</p>
                <p className="text-2xl font-semibold tracking-tight">$3,640</p>
              </div>
              <TrendingDown className="size-8 text-emerald-400" aria-hidden />
            </div>
          </motion.div>
        </section>

        <section className="border-y border-border/60 bg-muted/40 py-12">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Trusted by teams optimizing AI contracts</p>
            <div className="flex flex-wrap gap-6">
              <span>Series A SaaS</span>
              <span>Vertical AI</span>
              <span>Dev tooling</span>
              <span>Fintech infra</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl space-y-10 px-4 py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Three minutes, zero login.</h2>
            </div>
            <Link href="/audit" className={cn(buttonVariants({ variant: "ghost" }), "gap-2")}>
              Start now <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Map vendors",
                body: "Pick Cursor, Copilot, Claude, ChatGPT, Gemini, Windsurf, and API lines with seats + invoices.",
              },
              {
                title: "Rule-based audit",
                body: "Our engine compares spend to centralized pricing JSON — extensible and explainable.",
              },
              {
                title: "Share + capture",
                body: "Issue a public slug with OG previews, optional email for Credex follow-up.",
              },
            ].map((step, idx) => (
              <motion.div key={step.title} {...fadeUp} transition={{ delay: idx * 0.05 }}>
                <Card className="h-full border-border/70 bg-card/70">
                  <CardHeader>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.body}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
                Spend pain points
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Shadow AI tabs show up on Amex long before finance notices.</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <BarChart3 className="mt-1 size-4 text-indigo-400" aria-hidden />
                  Duplicate assistants across coding and writing workflows.
                </li>
                <li className="flex gap-3">
                  <BarChart3 className="mt-1 size-4 text-indigo-400" aria-hidden />
                  Enterprise tiers purchased for roadmap promises, not seats used.
                </li>
                <li className="flex gap-3">
                  <BarChart3 className="mt-1 size-4 text-indigo-400" aria-hidden />
                  API bills quietly eclipse bundled subscriptions for interactive use cases.
                </li>
              </ul>
            </div>
            <Card className="border-border/70 bg-gradient-to-b from-card to-muted/40 p-4">
              <CardHeader>
                <CardTitle>Before / After modeled stack</CardTitle>
                <CardDescription>Illustrative composite — your mileage varies by contract tier.</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0 p-4 pt-0">
                <BeforeAfterChart />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
            {[
              {
                quote:
                  "We thought we were on ChatGPT Team ‘cheap’. Turns out five rogue Copilot seats duplicated coverage.",
                author: "Layla M., VP Eng",
              },
              {
                quote:
                  "The seat mismatch callout alone saved a renewal conversation — CFO finally believed us.",
                author: "Ethan R., Head of IT",
              },
              {
                quote:
                  "Love that it’s rule-based. We could trace every savings line back to a vendor pricing URL.",
                author: "Priya S., Indie SaaS founder",
              },
            ].map((t) => (
              <Card key={t.author} className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardDescription className="text-base text-foreground">&ldquo;{t.quote}&rdquo;</CardDescription>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.author}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-8 px-4 py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Straight answers for skeptical CFOs.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Faq
              q="Do you use AI to calculate savings?"
              a="No — arithmetic and explicit rules only. LLMs may summarize findings after the fact."
            />
            <Faq q="Is pricing hardcoded?" a="Central JSON with versions + verification URLs; swap datasets without touching logic." />
            <Faq q="Can I share internally?" a="Yes — each audit gets a sanitized slug with OG/Twitter previews." />
            <Faq q="Do I need a login?" a="Never for the audit itself. Email is optional post-results." />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/20 via-background to-background p-10 text-center shadow-xl shadow-indigo-500/15">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">Ship your audit link before your next board deck.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Credex pairs modeled benchmarks with negotiation playbooks — book time if savings exceed your comfort zone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/audit" className={cn(buttonVariants({ size: "lg" }))}>
                Launch audit
              </Link>
              <a
                href={process.env.NEXT_PUBLIC_CAL_BOOKING_URL ?? "https://cal.com"}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Talk with Credex
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/70 bg-muted/40 py-10 text-sm text-muted-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Credex · AI Spend Audit</p>
            <div className="flex gap-4">
              <Link href="/audit" className="hover:text-foreground">
                Audit
              </Link>
              <a href="https://twitter.com" className="hover:text-foreground">
                Share on X
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "rose" | "sky";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-400"
      : tone === "rose"
        ? "text-rose-400"
        : "text-sky-400";
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
      <span>{label}</span>
      <span className={cn("font-medium", toneClass)}>{value}</span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl border border-border/70 bg-card/60 p-4 open:bg-card">
      <summary className="cursor-pointer text-base font-semibold">{q}</summary>
      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}
