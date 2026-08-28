import { z } from "zod";

/**
 * Shared contract between the contact form and the API route.
 * Both sides import the same schema so validation never drifts.
 */

/** Mirrors the service titles in `src/content/services.ts`, plus a catch-all. */
export const projectTypes = [
  "End-to-end web applications",
  "Portfolios & marketing sites",
  "E-commerce builds",
  "Payment integration",
  "Backend & API engineering",
  "Databases & caching",
  "Cloud, DevOps & deployment",
  "Maintenance & support",
  "Something else",
] as const;

/** Bands line up with the published plan and retainer prices. */
export const budgetRanges = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
  "Not sure yet",
] as const;

export const timelines = [
  "ASAP",
  "1–3 months",
  "3–6 months",
  "Just exploring",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell us what to call you (at least 2 characters).")
    .max(80, "That name is longer than 80 characters."),
  email: z.email("Enter an email address we can reply to."),
  company: z
    .string()
    .trim()
    .max(120, "Keep the company name under 120 characters.")
    .optional(),
  projectType: z.enum(projectTypes, {
    error: "Pick the option closest to what you need.",
  }),
  budget: z.enum(budgetRanges, {
    error: "Pick a budget range — a rough band is fine.",
  }),
  timeline: z.enum(timelines, {
    error: "Let us know roughly when you want to start.",
  }),
  message: z
    .string()
    .trim()
    .min(20, "A couple of sentences helps us give you a useful answer.")
    .max(4000, "Please keep it under 4,000 characters."),
  /** Bait field: real people never see it, so anything here means a bot. */
  honeypot: z.string().max(0).optional(),
  consent: z.boolean().refine((value) => value === true, {
    error: "Please confirm you are happy for us to reply.",
  }),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactFieldErrors = Partial<Record<keyof ContactInput, string[]>>;

export type ContactResponse = { ok: true } | { ok: false; errors: ContactFieldErrors };
