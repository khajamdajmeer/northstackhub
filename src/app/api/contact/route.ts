import { NextResponse } from "next/server";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { recordSubmission } from "@/lib/admin/data";
import {
  contactSchema,
  type ContactFieldErrors,
  type ContactInput,
  type ContactResponse,
} from "@/lib/contact-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rate limiting lives in module memory: it is per-instance and resets on every
 * cold start or redeploy, which is fine for a low-volume marketing form. Move
 * this to Redis/Upstash (a shared counter keyed by IP) before relying on it as
 * a real abuse control.
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();

  // Opportunistic sweep so the Map cannot grow without bound.
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }

  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function json(body: ContactResponse, status: number) {
  return NextResponse.json(body, { status });
}

function fail(errors: ContactFieldErrors, status = 400) {
  return json({ ok: false, errors }, status);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildText(data: ContactInput) {
  return [
    `New enquiry from ${siteConfig.domain}`,
    "",
    `Name:         ${data.name}`,
    `Email:        ${data.email}`,
    `Company:      ${data.company || "—"}`,
    `Project type: ${data.projectType}`,
    `Budget:       ${data.budget}`,
    `Timeline:     ${data.timeline}`,
    "",
    "Message",
    "-------",
    data.message,
    "",
    `Received: ${new Date().toUTCString()}`,
  ].join("\n");
}

function buildHtml(data: ContactInput) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#5b6478;font-size:13px;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-size:14px;color:#0b1020;">${escapeHtml(value)}</td></tr>`;

  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6;color:#0b1020;">
  <h2 style="margin:0 0 4px;font-size:18px;">New enquiry from ${siteConfig.domain}</h2>
  <p style="margin:0 0 16px;color:#5b6478;font-size:13px;">Received ${escapeHtml(new Date().toUTCString())}</p>
  <table style="border-collapse:collapse;margin-bottom:20px;">
    ${row("Name", data.name)}
    ${row("Email", data.email)}
    ${row("Company", data.company || "—")}
    ${row("Project type", data.projectType)}
    ${row("Budget", data.budget)}
    ${row("Timeline", data.timeline)}
  </table>
  <div style="border-top:1px solid #e3e7f0;padding-top:16px;">
    <p style="margin:0 0 8px;font-size:13px;color:#5b6478;">Message</p>
    <div style="white-space:pre-wrap;font-size:14px;">${escapeHtml(data.message)}</div>
  </div>
</div>`;
}

async function deliver(data: ContactInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Email delivery is not configured for this environment. The enquiry is
    // logged so nothing is silently dropped in development or preview builds;
    // set RESEND_API_KEY (see .env.example) to send real mail.
    console.info("[contact] email delivery not configured — enquiry logged only", {
      name: data.name,
      email: data.email,
      company: data.company,
      projectType: data.projectType,
      budget: data.budget,
      timeline: data.timeline,
      message: data.message,
      receivedAt: new Date().toISOString(),
    });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? "website@northstackhub.com",
      to: [process.env.CONTACT_TO_EMAIL ?? siteConfig.email],
      reply_to: data.email,
      subject: `New enquiry — ${data.projectType} (${data.budget})`,
      text: buildText(data),
      html: buildHtml(data),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 500)}`);
  }
}

/**
 * Writes the enquiry to Supabase so it shows up in the /aka console. Returns
 * quietly when no database is configured — the contact form is not allowed to
 * depend on it.
 */
async function persist(data: ContactInput, request: Request) {
  await recordSubmission({
    name: data.name,
    email: data.email,
    company: data.company || null,
    projectType: data.projectType,
    budget: data.budget,
    timeline: data.timeline,
    message: data.message,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  });
}

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return fail({ message: ["We could not read that request. Please try again."] });
    }

    // Checked before validation so a filled honeypot never surfaces as a field
    // error — the bot gets an ordinary success response and learns nothing.
    const honeypot = (payload as { honeypot?: unknown } | null)?.honeypot;
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      return json({ ok: true }, 200);
    }

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      return fail(z.flattenError(parsed.error).fieldErrors as ContactFieldErrors);
    }

    // Counted only once a submission is valid. Rejected payloads cost us nothing
    // to process, and metering them would lock out a visitor who simply mistyped
    // their email a few times.
    if (isRateLimited(getClientIp(request))) {
      return fail(
        {
          message: [
            "You have sent several messages recently. Give it a few minutes, or email us directly.",
          ],
        },
        429,
      );
    }

    // Recorded first so the enquiry survives even if email delivery fails, then
    // emailed. Neither step is allowed to lose the message on its own: a
    // database write that throws is logged and the email still goes out.
    await persist(parsed.data, request).catch((error) => {
      console.error("[contact] failed to record enquiry in the database", error);
    });

    await deliver(parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("[contact] failed to process enquiry", error);
    return fail(
      {
        message: [
          "Something broke on our side and the message was not sent. Please email us directly.",
        ],
      },
      500,
    );
  }
}
