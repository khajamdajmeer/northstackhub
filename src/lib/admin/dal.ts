import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getAdminCredentials,
  readSessionToken,
  SESSION_COOKIE,
  type AdminSession,
} from "./auth";

/**
 * Data Access Layer for the console.
 *
 * Every admin page and every mutating action calls through here rather than
 * trusting the proxy redirect. The proxy check in `proxy.ts` only sees whether
 * a cookie is present — it cannot verify the signature cheaply, and Next's docs
 * are explicit that it should not be the only line of defence. This is.
 *
 * Memoised with React `cache` so a page that renders several protected
 * components verifies once per request rather than once per component.
 */

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const credentials = getAdminCredentials();
  if (!credentials) return null;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token, credentials.sessionSecret);
  if (!session) return null;

  // A session signed for a different operator than the one currently
  // configured is not valid, even with an intact signature. This is what makes
  // changing ADMIN_EMAIL take effect immediately.
  if (session.email.toLowerCase() !== credentials.email.toLowerCase()) return null;

  return session;
});

/** Use in any page or action that must not render for a signed-out visitor. */
export const requireSession = cache(async (): Promise<AdminSession> => {
  const session = await getSession();
  if (!session) redirect("/aka/login");
  return session;
});
