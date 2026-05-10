"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Layers,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { nanoid } from "nanoid";
import posthog from "posthog-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { auditFromInput } from "@/lib/audit-engine";
import { AUDIT_RESULTS_ANALYSIS_TRANSITION_KEY } from "@/features/audit/constants";
import type { AuditSubmission } from "@/lib/validations/audit";
import { auditSubmissionSchema, companyStageSchema, useCaseSchema } from "@/lib/validations/audit";
import { vendorCatalog } from "@/lib/pricing/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formSchema = auditSubmissionSchema;

type FormValues = z.infer<typeof formSchema>;

const inputClass =
  "h-11 rounded-xl border-border/70 bg-background/90 shadow-sm transition-[border-color,box-shadow] focus-visible:border-indigo-500/40 focus-visible:ring-indigo-500/15 md:text-sm dark:bg-input/40";

const selectTriggerClass =
  "h-11 w-full rounded-xl border-border/70 bg-background/90 shadow-sm dark:bg-input/40";

function readSessionId(): string {
  const key = "ai-spend-audit-session";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = nanoid();
    window.localStorage.setItem(key, id);
  }
  return id;
}

function persistDraft(values: FormValues) {
  try {
    window.localStorage.setItem("ai-spend-audit-draft", JSON.stringify(values));
    const sp = new URLSearchParams();
    sp.set("teamSize", String(values.teamSize));
    sp.set("companyStage", values.companyStage);
    sp.set("useCase", values.useCase);
    window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
  } catch {
    /* ignore */
  }
}

function loadDraft(): Partial<FormValues> | null {
  try {
    const raw = window.localStorage.getItem("ai-spend-audit-draft");
    if (!raw) return null;
    return JSON.parse(raw) as Partial<FormValues>;
  } catch {
    return null;
  }
}

const emptyTool = {
  vendorId: "",
  planId: "",
  monthlySpend: undefined as unknown as number,
  seats: undefined as unknown as number,
};

export function AuditForm() {
  const router = useRouter();
  const trackedStart = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tools: [emptyTool],
      teamSize: undefined as unknown as number,
      companyStage: undefined as unknown as FormValues["companyStage"],
      useCase: undefined as unknown as FormValues["useCase"],
      sessionId: undefined,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "tools" });

  useEffect(() => {
    const draft = loadDraft();
    const sp = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const teamSizeRaw = sp.get("teamSize") ?? (draft?.teamSize != null ? String(draft.teamSize) : null);
    const teamSize = teamSizeRaw != null ? Number(teamSizeRaw) : Number.NaN;
    const companyStageRaw = sp.get("companyStage") ?? draft?.companyStage;
    const useCaseRaw = sp.get("useCase") ?? draft?.useCase;
    const companyStage = companyStageSchema.safeParse(companyStageRaw).success
      ? (companyStageRaw as FormValues["companyStage"])
      : undefined;
    const useCase = useCaseSchema.safeParse(useCaseRaw).success
      ? (useCaseRaw as FormValues["useCase"])
      : undefined;

    form.reset({
      tools:
        draft?.tools && draft.tools.length > 0
          ? draft.tools
          : [emptyTool],
      teamSize: Number.isFinite(teamSize) && teamSize > 0 ? teamSize : (undefined as unknown as number),
      companyStage: companyStage as unknown as FormValues["companyStage"],
      useCase: useCase as unknown as FormValues["useCase"],
      sessionId: readSessionId(),
    });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || trackedStart.current) return;
    trackedStart.current = true;
    try {
      posthog.capture("audit_started");
    } catch {
      /* PostHog optional when not configured */
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "audit_started",
        sessionId: readSessionId(),
        path: "/audit",
      }),
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const sub = form.watch((values) => {
      const parsed = formSchema.safeParse(values);
      if (parsed.success) persistDraft(parsed.data);
    });
    return () => sub.unsubscribe();
  }, [form, hydrated]);

  function onSubmit(values: FormValues) {
    const sid = readSessionId();
    const payload: AuditSubmission = { ...values, sessionId: sid };
    const engineInput = {
      tools: payload.tools.map((t) => ({
        vendorId: t.vendorId,
        planId: t.planId,
        monthlySpend: t.monthlySpend,
        seats: t.seats,
      })),
      teamSize: payload.teamSize,
      companyStage: payload.companyStage,
      useCase: payload.useCase,
    };
    const result = auditFromInput(engineInput);
    const snapshot = {
      payload,
      result,
      persisted: false as const,
      auditId: undefined as string | undefined,
      shareUrl: undefined as string | undefined,
    };
    sessionStorage.setItem("audit-result", JSON.stringify(snapshot));
    sessionStorage.setItem(AUDIT_RESULTS_ANALYSIS_TRANSITION_KEY, "1");
    try {
      posthog.capture("audit_completed_local");
    } catch {
      /* optional analytics */
    }
    router.push("/audit/results");
  }

  return (
    <main className="relative mx-auto max-w-3xl px-4 pb-24 pt-8 sm:pt-12 lg:max-w-4xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 space-y-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 font-medium text-indigo-700 dark:text-indigo-300">
            <Sparkles className="size-3.5" aria-hidden />
            Credex audit
          </Badge>
          <Badge variant="outline" className="rounded-full border-emerald-500/25 bg-emerald-500/5 px-3 py-1 font-normal text-emerald-800 dark:text-emerald-300">
            <Lock className="mr-1 inline size-3 opacity-70" aria-hidden />
            No login required
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2.35rem] lg:text-5xl">
            Map your AI stack.
            <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-sky-400">
              See modeled savings first.
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Add vendors, plans, and real monthly spend. We benchmark against versioned public pricing —
            then you get results before any email gate.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <RefreshCw className="size-3.5 shrink-0 text-indigo-500" aria-hidden />
            Autosaves locally + URL
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Rule-based math — not LLM guesses
          </span>
        </div>
      </motion.div>

      {!hydrated ? (
        <Card className="overflow-hidden border-border/60 bg-card/50 shadow-xl shadow-indigo-950/5 backdrop-blur-sm dark:shadow-black/20">
          <CardHeader className="space-y-3 border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-indigo-500" aria-hidden />
              Restoring your draft…
            </div>
            <Skeleton className="h-4 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-sm" />
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl sm:col-span-2" />
            <Skeleton className="h-40 rounded-xl sm:col-span-3" />
          </CardContent>
        </Card>
      ) : null}

      <form className={cn("space-y-10", !hydrated && "pointer-events-none opacity-40")} onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step rail */}
        <nav aria-label="Audit steps" className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-indigo-500/25">
            <span className="flex size-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
              1
            </span>
            Organization
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full border border-border bg-background text-[11px]">
              2
            </span>
            AI spend lines
          </span>
        </nav>

        {/* Org */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="overflow-hidden border-border/60 shadow-lg shadow-indigo-950/[0.04] ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
            <CardHeader className="relative border-b border-border/50 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.05] pb-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Building2 className="size-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-xl tracking-tight">Organization context</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Shapes enterprise vs. seat rules — helps flag mismatched team tiers for your headcount.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="teamSize" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Team size
                </Label>
                <Input
                  id="teamSize"
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  {...form.register("teamSize", { valueAsNumber: true })}
                />
                {form.formState.errors.teamSize && (
                  <p className="text-xs text-destructive">{form.formState.errors.teamSize.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company stage</Label>
                <Select
                  value={form.watch("companyStage")}
                  onValueChange={(v) => {
                    if (typeof v !== "string") return;
                    form.setValue("companyStage", v as FormValues["companyStage"], {
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="series_b_plus">Series B+</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary use</Label>
                <Select
                  value={form.watch("useCase")}
                  onValueChange={(v) => {
                    if (typeof v !== "string") return;
                    form.setValue("useCase", v as FormValues["useCase"], { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tools */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-border/60 shadow-lg shadow-indigo-950/[0.04] ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
            <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-muted/15 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-sm">
                  <Layers className="size-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-xl tracking-tight">Tools & spend</CardTitle>
                  <CardDescription className="mt-1 max-w-lg text-base leading-relaxed">
                    One row per invoice line — Cursor, Copilot, Claude, ChatGPT, Gemini, APIs, etc.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 rounded-xl border-dashed border-indigo-500/35 bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08]"
                onClick={() =>
                  append({
                    ...emptyTool,
                  })
                }
              >
                <Plus className="size-4" aria-hidden />
                Add tool
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {fields.map((field, index) => {
                const vendorId = form.watch(`tools.${index}.vendorId`);
                const vendor = vendorCatalog.find((v) => v.id === vendorId) ?? vendorCatalog[0];
                return (
                  <motion.div
                    key={field.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-6 shadow-sm ring-1 ring-black/[0.02] dark:from-card dark:to-muted/15 dark:ring-white/[0.04]"
                  >
                    <div className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 opacity-90" aria-hidden />
                    <div className="relative pl-5">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold tracking-tight text-foreground">
                            Spend line
                          </span>
                          <Badge variant="outline" className="font-normal text-muted-foreground">
                            {vendor.name}
                          </Badge>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Vendor
                          </Label>
                          <Select
                            value={vendorId}
                            onValueChange={(v) => {
                              if (typeof v !== "string") return;
                              form.setValue(`tools.${index}.vendorId`, v, { shouldValidate: true });
                              const next = vendorCatalog.find((x) => x.id === v);
                              if (next?.plans[0]) {
                                form.setValue(`tools.${index}.planId`, next.plans[0].id, {
                                  shouldValidate: true,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              {vendorCatalog.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Plan
                          </Label>
                          <Select
                            value={form.watch(`tools.${index}.planId`)}
                            onValueChange={(planId) => {
                              if (typeof planId !== "string") return;
                              form.setValue(`tools.${index}.planId`, planId, {
                                shouldValidate: true,
                              });
                            }}
                          >
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {vendor.plans.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`spend-${index}`}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            <Wallet className="size-3.5 opacity-70" aria-hidden />
                            Monthly spend (USD)
                          </Label>
                          <Input
                            id={`spend-${index}`}
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            className={inputClass}
                            {...form.register(`tools.${index}.monthlySpend`, { valueAsNumber: true })}
                          />
                          {form.formState.errors.tools?.[index]?.monthlySpend && (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.tools[index]?.monthlySpend?.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`seats-${index}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Seats / users
                          </Label>
                          <Input
                            id={`seats-${index}`}
                            type="number"
                            inputMode="numeric"
                            className={inputClass}
                            {...form.register(`tools.${index}.seats`, { valueAsNumber: true })}
                          />
                          {form.formState.errors.tools?.[index]?.seats && (
                            <p className="text-xs text-destructive">
                              {form.formState.errors.tools[index]?.seats?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {form.formState.errors.tools?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.tools.root.message}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <div className="sticky bottom-4 z-10 flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 dark:border-white/10 dark:shadow-black/40 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Draft syncs to this browser and query params.{" "}
            <Link href="/" className="font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400">
              ← Landing
            </Link>
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={!hydrated}
            className="h-12 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-[transform,box-shadow] hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 active:translate-y-px disabled:opacity-50"
          >
            Generate audit
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </form>
    </main>
  );
}
