"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AuditEngineResult } from "@/lib/audit-engine";
import type { AuditSubmission } from "@/lib/validations/audit";
import { leadSubmissionSchema } from "@/lib/validations/audit";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PrintSaveButton } from "@/components/print-save-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Snapshot = {
  payload: AuditSubmission;
  result: AuditEngineResult;
  persisted: boolean;
  auditId?: string;
  shareUrl?: string;
};

const leadFormSchema = leadSubmissionSchema;

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function AuditResultsView() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [execSummary, setExecSummary] = useState<string | null>(null);
  const [summarySource, setSummarySource] = useState<string | null>(null);
  const finalizeOnce = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("audit-result");
      if (!raw) {
        router.replace("/audit");
        return;
      }
      const parsed = JSON.parse(raw) as Snapshot;
      setSnapshot(parsed);
    } catch {
      router.replace("/audit");
    }
  }, [router]);

  useEffect(() => {
    if (!snapshot || finalizeOnce.current) return;
    finalizeOnce.current = true;

    async function finalize(current: Snapshot) {
      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current.payload),
        });
        const data = (await res.json()) as {
          auditId?: string;
          shareUrl?: string;
          error?: string;
          result?: AuditEngineResult;
        };
        if (!res.ok && data.error === "persist_failed") {
          setPersistError("Database unavailable — share links may be ephemeral on this deploy.");
        }
        const engineResult = data.result ?? current.result;
        const next: Snapshot = {
          ...current,
          result: engineResult,
          persisted: Boolean(data.auditId),
          auditId: data.auditId,
          shareUrl: data.shareUrl,
        };
        setSnapshot(next);
        sessionStorage.setItem("audit-result", JSON.stringify(next));
        posthog.capture("audit_persisted", { ok: Boolean(data.auditId) });
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "audit_completed",
            auditId: data.auditId,
            path: "/audit/results",
          }),
        });

        const summaryRes = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auditId: data.auditId,
            teamSize: current.payload.teamSize,
            companyStage: current.payload.companyStage,
            useCase: current.payload.useCase,
            result: engineResult,
          }),
        });
        if (summaryRes.ok) {
          const s = (await summaryRes.json()) as { summary: string; source: string };
          setExecSummary(s.summary);
          setSummarySource(s.source);
        }
      } catch {
        setPersistError("Could not reach API to finalize your report.");
      }
    }

    void finalize(snapshot);
  }, [snapshot]);

  const savingsTier = useMemo(() => {
    if (!snapshot) return "unknown";
    const m = snapshot.result.totalMonthlySavings;
    if (m >= 500) return "high";
    if (m < 100) return "low";
    return "mid";
  }, [snapshot]);

  const leadForm = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      email: "",
      company: "",
      role: "",
      teamSize: snapshot?.payload.teamSize,
      auditId: snapshot?.auditId ?? "",
      website: "",
      referralSource: "direct",
    },
  });

  useEffect(() => {
    if (!snapshot?.auditId) return;
    leadForm.setValue("auditId", snapshot.auditId);
    leadForm.setValue("teamSize", snapshot.payload.teamSize);
  }, [snapshot, leadForm]);

  async function onLeadSubmit(values: LeadFormValues) {
    posthog.capture("lead_submit_attempt");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      leadForm.setError("email", { message: "Could not save — try again." });
      return;
    }
    posthog.capture("email_captured");
    leadForm.reset({ ...values, email: "" });
    alert("Saved — check your inbox for the Credex snapshot.");
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-16">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const { result, payload } = snapshot;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            Audit results
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Visibility into ${result.totalMonthlySpend.toFixed(0)}/mo of AI spend
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Rule-based modeled benchmarks — not LLM guesswork. Tune assumptions with your finance
            partner before vendor negotiations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintSaveButton label="Download / Print PDF" />
          {snapshot.shareUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(snapshot.shareUrl!);
                posthog.capture("share_copy_clicked");
              }}
            >
              Copy share link
            </Button>
          )}
          <Link href="/audit" className={cn(buttonVariants({ variant: "secondary", size: "default" }))}>
            Adjust inputs
          </Link>
        </div>
      </div>

      {persistError && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Persistence notice</CardTitle>
            <CardDescription>{persistError}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-indigo-500/15 via-background to-background p-8 shadow-lg shadow-indigo-500/10"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated monthly savings</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight">
                ${result.totalMonthlySavings.toFixed(0)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                ~${result.totalAnnualSavings.toFixed(0)} annualized (rule-based, not a guarantee)
              </p>
            </div>
            <div className="grid w-full max-w-sm gap-4 rounded-2xl bg-background/70 p-4 ring-1 ring-border/80 backdrop-blur">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Optimization score</span>
                  <span>{result.optimizationScore}/100</span>
                </div>
                <Progress className="mt-2 h-2" value={result.optimizationScore} />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Seat efficiency</span>
                  <span>{result.efficiencyScore}/100</span>
                </div>
                <Progress className="mt-2 h-2" value={result.efficiencyScore} />
              </div>
            </div>
          </div>
        </motion.div>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Executive memo</CardTitle>
            <CardDescription>
              ~100 words. Prefer Google Gemini (free API tier) when GEMINI_API_KEY is set; otherwise Claude/OpenAI or a template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!execSummary ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <Textarea readOnly value={execSummary} className="min-h-[160px] resize-none text-sm" />
                {summarySource && (
                  <p className="text-xs text-muted-foreground">Source: {summarySource}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {savingsTier === "high" && (
        <Card className="border-indigo-500/40 bg-indigo-500/5">
          <CardHeader>
            <CardTitle>High-impact stack — talk with Credex this week</CardTitle>
            <CardDescription>
              When modeled savings exceed $500/mo, vendor consolidation and renewal timing compound
              quickly. Book a working session to pressure-test these scenarios against your contracts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_CAL_BOOKING_URL ?? "https://cal.com"}
              className={cn(buttonVariants({ size: "lg" }))}
              onClick={() => posthog.capture("consultation_cta_clicked")}
            >
              Book Credex consult
            </a>
            <p className="text-xs text-muted-foreground">
              No obligation — bring invoices and we&apos;ll sanity-check benchmarks live.
            </p>
          </CardContent>
        </Card>
      )}

      {savingsTier === "low" && (
        <Card>
          <CardHeader>
            <CardTitle>Your stack is already well optimized.</CardTitle>
            <CardDescription>
              Modeled uplift under $100/mo — nice work. Still drop your email for refresh alerts when
              vendors ship new SKUs.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Per-tool breakdown</h2>
          <p className="text-xs text-muted-foreground">
            Team context: {payload.teamSize} · {payload.companyStage.split("_").join(" ")} ·{" "}
            {payload.useCase}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {result.tools.map((t) => (
            <Card key={`${t.vendorId}-${t.currentPlanId}`} className="border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.vendorName}</CardTitle>
                <CardDescription>
                  {t.currentPlanLabel} → {t.recommendedPlanLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current spend</span>
                  <span className="font-medium">${t.currentMonthlySpend.toFixed(0)}/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modeled savings</span>
                  <span className="font-semibold text-emerald-500">
                    ${t.monthlySavings.toFixed(0)}/mo · ${t.annualSavings.toFixed(0)}/yr
                  </span>
                </div>
                <p className="leading-relaxed text-muted-foreground">{t.reasoning}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Email capture</CardTitle>
          <CardDescription>
            Optional — used for Credex follow-up and pricing drift alerts. No passwords, no spammy drip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={leadForm.handleSubmit(onLeadSubmit)}>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              {...leadForm.register("website")}
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" autoComplete="email" {...leadForm.register("email")} />
              {leadForm.formState.errors.email && (
                <p className="text-xs text-destructive">{leadForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...leadForm.register("company")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Founder, CFO, Eng Manager…" {...leadForm.register("role")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTeamSize">Team size (optional)</Label>
              <Input
                id="leadTeamSize"
                type="number"
                {...leadForm.register("teamSize", { valueAsNumber: true })}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit" disabled={!snapshot.auditId}>
                Notify me &amp; send PDF-ready summary
              </Button>
              {!snapshot.auditId && (
                <p className="text-xs text-muted-foreground">
                  Waiting for audit ID — database may be offline on this preview deploy.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
