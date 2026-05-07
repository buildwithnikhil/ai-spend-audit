"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import posthog from "posthog-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { auditFromInput } from "@/lib/audit-engine";
import type { AuditSubmission } from "@/lib/validations/audit";
import { auditSubmissionSchema, companyStageSchema, useCaseSchema } from "@/lib/validations/audit";
import { vendorCatalog } from "@/lib/pricing/catalog";
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

const formSchema = auditSubmissionSchema;

type FormValues = z.infer<typeof formSchema>;

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

export function AuditForm() {
  const router = useRouter();
  const trackedStart = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tools: [
        {
          vendorId: "cursor",
          planId: "pro",
          monthlySpend: 80,
          seats: 6,
        },
      ],
      teamSize: 12,
      companyStage: "seed",
      useCase: "coding",
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
    const teamSize = Number(sp.get("teamSize") ?? draft?.teamSize ?? 12);
    const companyStageRaw = sp.get("companyStage") ?? draft?.companyStage ?? "seed";
    const useCaseRaw = sp.get("useCase") ?? draft?.useCase ?? "coding";
    const companyStage = companyStageSchema.safeParse(companyStageRaw).success
      ? (companyStageRaw as FormValues["companyStage"])
      : "seed";
    const useCase = useCaseSchema.safeParse(useCaseRaw).success
      ? (useCaseRaw as FormValues["useCase"])
      : "coding";

    form.reset({
      tools:
        draft?.tools && draft.tools.length > 0
          ? draft.tools
          : [
              {
                vendorId: "cursor",
                planId: "pro",
                monthlySpend: 80,
                seats: 6,
              },
            ],
      teamSize: Number.isFinite(teamSize) && teamSize > 0 ? teamSize : 12,
      companyStage,
      useCase,
      sessionId: readSessionId(),
    });
    setHydrated(true);
    // Intentionally mount-only: Next `useSearchParams()` can be empty on first paint; object identity also changes each render.
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
    try {
      posthog.capture("audit_completed_local");
    } catch {
      /* optional analytics */
    }
    router.push("/audit/results");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-8 px-4 py-10"
    >
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-indigo-500">
          Credex · AI Spend Audit
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Map your AI stack. See savings before you share an email.
        </h1>
        <p className="text-muted-foreground">
          Add each vendor once with seats and actual invoices. We benchmark against versioned public
          pricing, then you can save a shareable report.
        </p>
      </div>

      {!hydrated ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Loading your draft…</CardTitle>
            <CardDescription>Pulling autosaved inputs from this browser.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-border/70 shadow-sm shadow-indigo-500/5">
          <CardHeader>
            <CardTitle>Org context</CardTitle>
            <CardDescription>Helps us tune enterprise vs. seat mismatch rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Total team size</Label>
              <Input
                id="teamSize"
                type="number"
                inputMode="numeric"
                {...form.register("teamSize", { valueAsNumber: true })}
              />
              {form.formState.errors.teamSize && (
                <p className="text-xs text-destructive">{form.formState.errors.teamSize.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Company stage</Label>
              <Select
                value={form.watch("companyStage")}
                onValueChange={(v) => {
                  if (typeof v !== "string") return;
                  form.setValue("companyStage", v as FormValues["companyStage"], {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger>
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
              <Label>Primary use case</Label>
              <Select
                value={form.watch("useCase")}
                onValueChange={(v) => {
                  if (typeof v !== "string") return;
                  form.setValue("useCase", v as FormValues["useCase"], { shouldValidate: true });
                }}
              >
                <SelectTrigger>
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

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Tools in scope</CardTitle>
              <CardDescription>Include every AI SKU billed to engineering or GTM.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  vendorId: "chatgpt",
                  planId: "team",
                  monthlySpend: 150,
                  seats: 8,
                })
              }
            >
              Add tool
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => {
              const vendorId = form.watch(`tools.${index}.vendorId`);
              const vendor = vendorCatalog.find((v) => v.id === vendorId) ?? vendorCatalog[0];
              return (
                <div key={field.id} className="rounded-xl border border-border/70 bg-card/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium">Tool {index + 1}</p>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="xs" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <Separator className="my-4" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Vendor</Label>
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
                        <SelectTrigger>
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
                      <Label>Plan</Label>
                      <Select
                        value={form.watch(`tools.${index}.planId`)}
                        onValueChange={(planId) => {
                          if (typeof planId !== "string") return;
                          form.setValue(`tools.${index}.planId`, planId, {
                            shouldValidate: true,
                          });
                        }}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor={`spend-${index}`}>Monthly spend (USD)</Label>
                      <Input
                        id={`spend-${index}`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        {...form.register(`tools.${index}.monthlySpend`, { valueAsNumber: true })}
                      />
                      {form.formState.errors.tools?.[index]?.monthlySpend && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.tools[index]?.monthlySpend?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`seats-${index}`}>Seats / users</Label>
                      <Input
                        id={`seats-${index}`}
                        type="number"
                        inputMode="numeric"
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
              );
            })}
            {form.formState.errors.tools?.root && (
              <p className="text-sm text-destructive">{form.formState.errors.tools.root.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Draft autosaves locally and mirrors key fields to the URL for refresh-safe recovery.{" "}
            <Link href="/" className="text-indigo-500 underline-offset-4 hover:underline">
              Back to landing
            </Link>
          </p>
          <Button type="submit" size="lg">
            Generate audit
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
