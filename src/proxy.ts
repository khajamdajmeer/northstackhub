import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic auth gate for the console.
 *
 * This only looks at whether a session cookie is present — it does not verify
 * the signature. That check belongs next to the data, and lives in
 * `src/lib/admin/dal.ts`, which every /aka page and action goes through. Next's
 * docs are explicit that proxy runs detached from render code (and may be
 * served from the CDN), so it must not be treated as the security boundary.
 *
 * What it buys us: a signed-out visitor is redirected before any admin route is
 * rendered, and a signed-in one never lands on the login form.
 */

const SESSION_COOKIE = "aka_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/aka/login";

  if (!hasCookie && !isLogin) {
    const url = new URL("/aka/login", request.url);
    // Preserve where they were headed so sign-in can return them to it.
    if (pathname !== "/aka") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasCookie && isLogin) {
    return NextResponse.redirect(new URL("/aka", request.url));
  }

  // Belt and braces: the console must never be cached or indexed, whatever a
  // CDN or crawler decides on its own.
  const response = NextResponse.next();
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: "/aka/:path*",
};
