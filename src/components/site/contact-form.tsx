"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { CircleAlert, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  budgetRanges,
  contactSchema,
  projectTypes,
  timelines,
  type ContactFieldErrors,
  type ContactResponse,
} from "@/lib/contact-schema";

type FormValues = {
  name: string;
  email: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
  honeypot: string;
  consent: boolean;
};

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "error";

const emptyValues: FormValues = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  budget: "",
  timeline: "",
  message: "",
  honeypot: "",
  consent: false,
};

const controlBase =
  "w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground transition-colors placeholder:text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60";

function fieldClasses(invalid: boolean, extra?: string) {
  return cn(controlBase, "h-11", invalid && "border-warning", extra);
}

function textareaClasses(invalid: boolean) {
  return cn(controlBase, "min-h-40 resize-y py-3 leading-relaxed", invalid && "border-warning");
}

/** Collapses zod's per-field arrays into the first message we want to show. */
function firstErrors(errors: ContactFieldErrors): FieldErrors {
  const next: FieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const first = messages?.[0];
    if (first) next[key as FieldName] = first;
  }
  return next;
}

export function ContactForm() {
  const formId = useId();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formMessage, setFormMessage] = useState("");

  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: string) => `${formId}-${name}-error`;

  function update<K extends FieldName>(name: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function describedBy(name: FieldName, hintId?: string) {
    const ids = [hintId, errors[name] ? errorId(name) : undefined].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setFormMessage("");

    const parsed = contactSchema.safeParse({
      ...values,
      company: values.company.trim() === "" ? undefined : values.company,
    });

    if (!parsed.success) {
      const fieldErrors = firstErrors(
        z.flattenError(parsed.error).fieldErrors as ContactFieldErrors,
      );
      setErrors(fieldErrors);
      setStatus("error");
      setFormMessage("Please fix the highlighted fields and send again.");
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = (await response.json().catch(() => null)) as ContactResponse | null;

      if (response.ok && result?.ok) {
        setStatus("success");
        setFormMessage("Thanks — your message is with us.");
        return;
      }

      const returnedErrors = result && !result.ok ? firstErrors(result.errors) : {};
      setErrors(returnedErrors);
      setStatus("error");
      setFormMessage(
        returnedErrors.message ??
          "We could not send that message. Please try again, or email us directly.",
      );
    } catch {
      setStatus("error");
      setFormMessage(
        "The request did not reach us — check your connection and try again. Your details are still here.",
      );
    }
  }

  function reset() {
    setValues(emptyValues);
    setErrors({});
    setStatus("idle");
    setFormMessage("");
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-fade-up rounded-card border border-border bg-surface p-8"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-success">
          <CircleCheck className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Message received</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A real person reads every enquiry. You will get a reply within four business hours, and it
          will either answer your question or propose a time to talk it through.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          If it is urgent, reply to that email and say so — we will move it up the queue.
        </p>
        <Button type="button" variant="secondary" className="mt-6" onClick={reset}>
          Send another message
        </Button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("name")} className="text-sm font-medium">
            Your name <span className="text-warning">*</span>
          </label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jordan Ellis"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            className={fieldClasses(Boolean(errors.name))}
          />
          {errors.name ? (
            <p id={errorId("name")} className="text-xs text-warning">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("email")} className="text-sm font-medium">
            Email <span className="text-warning">*</span>
          </label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className={fieldClasses(Boolean(errors.email))}
          />
          {errors.email ? (
            <p id={errorId("email")} className="text-xs text-warning">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("company")} className="text-sm font-medium">
          Company <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={fieldId("company")}
          name="company"
          type="text"
          autoComplete="organization"
          placeholder="Northwind Retail"
          value={values.company}
          onChange={(event) => update("company", event.target.value)}
          aria-invalid={Boolean(errors.company)}
          aria-describedby={describedBy("company")}
          className={fieldClasses(Boolean(errors.company))}
        />
        {errors.company ? (
          <p id={errorId("company")} className="text-xs text-warning">
            {errors.company}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("projectType")} className="text-sm font-medium">
          What do you need? <span className="text-warning">*</span>
        </label>
        <select
          id={fieldId("projectType")}
          name="projectType"
          value={values.projectType}
          onChange={(event) => update("projectType", event.target.value)}
          aria-invalid={Boolean(errors.projectType)}
          aria-describedby={describedBy("projectType")}
          className={fieldClasses(Boolean(errors.projectType), "pr-10")}
        >
          <option value="">Select the closest match</option>
          {projectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.projectType ? (
          <p id={errorId("projectType")} className="text-xs text-warning">
            {errors.projectType}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("budget")} className="text-sm font-medium">
            Budget range <span className="text-warning">*</span>
          </label>
          <select
            id={fieldId("budget")}
            name="budget"
            value={values.budget}
            onChange={(event) => update("budget", event.target.value)}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={describedBy("budget", fieldId("budget-hint"))}
            className={fieldClasses(Boolean(errors.budget), "pr-10")}
          >
            <option value="">Select a range</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          <p id={fieldId("budget-hint")} className="text-xs text-muted">
            A band is enough — it tells us what scope is realistic.
          </p>
          {errors.budget ? (
            <p id={errorId("budget")} className="text-xs text-warning">
              {errors.budget}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("timeline")} className="text-sm font-medium">
            Timeline <span className="text-warning">*</span>
          </label>
          <select
            id={fieldId("timeline")}
            name="timeline"
            value={values.timeline}
            onChange={(event) => update("timeline", event.target.value)}
            aria-invalid={Boolean(errors.timeline)}
            aria-describedby={describedBy("timeline")}
            className={fieldClasses(Boolean(errors.timeline), "pr-10")}
          >
            <option value="">Select a timeline</option>
            {timelines.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.timeline ? (
            <p id={errorId("timeline")} className="text-xs text-warning">
              {errors.timeline}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("message")} className="text-sm font-medium">
          Project details <span className="text-warning">*</span>
        </label>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={7}
          placeholder="What are you building, who is it for, and what needs to be true for it to be a success? Links to anything existing are welcome."
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message", fieldId("message-hint"))}
          className={textareaClasses(Boolean(errors.message))}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={fieldId("message-hint")} className="text-xs text-muted">
            The more context you give, the more specific our first reply can be.
          </p>
          <p className="text-xs text-muted tabular-nums">{values.message.length} / 4000</p>
        </div>
        {errors.message ? (
          <p id={errorId("message")} className="text-xs text-warning">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
        aria-hidden
      >
        <label htmlFor={fieldId("honeypot")}>Leave this field empty</label>
        <input
          id={fieldId("honeypot")}
          name="honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={(event) => update("honeypot", event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id={fieldId("consent")}
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(event) => update("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent")}
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-brand focus-visible:ring-2 focus-visible:ring-ring/60",
              errors.consent && "border-warning",
            )}
          />
          <label htmlFor={fieldId("consent")} className="text-sm leading-relaxed text-muted">
            I am happy for {siteConfig.name} to store these details and reply to me about this enquiry.
            No newsletter, no sharing with anyone else — see the{" "}
            <a href="/privacy" className="text-brand underline underline-offset-4">
              privacy notice
            </a>
            .
          </label>
        </div>
        {errors.consent ? (
          <p id={errorId("consent")} className="text-xs text-warning">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Send enquiry
            </>
          )}
        </Button>
        <p className="text-xs text-muted">No obligation. We reply within 4 business hours.</p>
      </div>

      <div role="status" aria-live="polite" className="min-h-0">
        {status === "error" && formMessage ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <p className="text-sm leading-relaxed text-warning">
              {formMessage}{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="underline underline-offset-4"
              >
                Email us instead
              </a>
              .
            </p>
          </div>
        ) : null}
        {submitting ? <p className="sr-only">Sending your message…</p> : null}
      </div>
    </form>
  );
}
