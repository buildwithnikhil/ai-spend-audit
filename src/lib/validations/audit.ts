import { z } from "zod";

export const companyStageSchema = z.enum([
  "idea",
  "seed",
  "series_a",
  "series_b_plus",
  "enterprise",
]);

export const useCaseSchema = z.enum([
  "coding",
  "writing",
  "research",
  "data",
  "mixed",
]);

export const auditToolSchema = z.object({
  vendorId: z.string().min(1),
  planId: z.string().min(1),
  monthlySpend: z.number().finite().nonnegative(),
  seats: z.number().int().positive(),
});

export const auditSubmissionSchema = z.object({
  tools: z.array(auditToolSchema).min(1),
  teamSize: z.number().int().positive(),
  companyStage: companyStageSchema,
  useCase: useCaseSchema,
  sessionId: z.string().optional(),
});

export type AuditSubmission = z.infer<typeof auditSubmissionSchema>;

export const leadSubmissionSchema = z.object({
  email: z.string().email(),
  company: z.string().max(200).optional(),
  role: z.string().max(120).optional(),
  teamSize: z.number().int().positive().optional(),
  auditId: z.string().min(1),
  /** Honeypot — must stay empty for humans */
  website: z.string().max(200).optional(),
  referralSource: z.string().max(200).optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

export const analyticsEventSchema = z.object({
  eventType: z.string().min(1),
  sessionId: z.string().optional(),
  auditId: z.string().optional(),
  path: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
