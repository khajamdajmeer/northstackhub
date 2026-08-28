import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/site/logo";
import { getSession } from "@/lib/admin/dal";
import { getAdminCredentials } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// The session cookie must be read on every request, so this page can never be
// prerendered.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // The proxy already bounces a request that carries a cookie, but it only
  // checks that one is present. A stale or forged cookie lands here, where the
  // signature is actually verified.
  if (await getSession()) redirect("/aka");

  const { next } = await searchParams;
  const configured = Boolean(getAdminCredentials());

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-10" />
          <h1 className="text-xl font-semibold tracking-tight">Console</h1>
          <p className="text-sm text-muted">
            Enquiries and activity for {process.env.NEXT_PUBLIC_SITE_URL ?? "northstackhub.com"}
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          {configured ? (
            <LoginForm next={next ?? "/aka"} />
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <p className="font-medium">This console is not configured yet.</p>
              <p className="leading-relaxed text-muted">
                Set <code className="font-mono text-xs">ADMIN_EMAIL</code>,{" "}
                <code className="font-mono text-xs">ADMIN_PASSWORD_HASH</code> and{" "}
                <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> in the
                environment, then reload. Generate the hash with{" "}
                <code className="font-mono text-xs">npm run admin:hash</code>.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}
