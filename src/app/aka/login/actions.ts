"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSessionToken,
  getAdminCredentials,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/data";

export type LoginState = { error: string | null };

/**
 * Only redirect to paths inside the console. Without this an attacker could
 * hand someone a /aka/login?next=https://evil.example link and use our own
 * sign-in as an open redirect.
 */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/aka";
  if (!value.startsWith("/aka") || value.startsWith("//")) return "/aka";
  return value;
}

async function requestContext() {
  const headerList = await headers();
  return {
    ipAddress:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      null,
    userAgent: headerList.get("user-agent"),
  };
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return {
      error:
        "The console is not configured on this deployment. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const context = await requestContext();

  const emailMatches = email.toLowerCase() === credentials.email.toLowerCase();
  // The password is verified even when the email is wrong, so a wrong address
  // and a wrong password take the same time to reject. Skipping the hash on a
  // bad email would leak which half was correct.
  const passwordMatches = await verifyPassword(password, credentials.passwordHash);

  if (!emailMatches || !passwordMatches) {
    await recordAudit({
      actor: email || "unknown",
      action: "auth.sign_in_failed",
      metadata: { reason: emailMatches ? "bad_password" : "unknown_email" },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    // Deliberately does not say which field was wrong.
    return { error: "Those credentials were not accepted." };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(credentials.email, credentials.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  await recordAudit({
    actor: credentials.email,
    action: "auth.sign_in",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  redirect(next);
}

export async function signOut() {
  const credentials = getAdminCredentials();
  const context = await requestContext();

  (await cookies()).delete(SESSION_COOKIE);

  await recordAudit({
    actor: credentials?.email ?? "unknown",
    action: "auth.sign_out",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  redirect("/aka/login");
}
