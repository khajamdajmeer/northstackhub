import Link from "next/link";
import { Inbox, LogOut, ScrollText } from "lucide-react";

import { LogoMark } from "@/components/site/logo";
import { signOut } from "@/app/aka/login/actions";

const nav = [
  { href: "/aka", label: "Enquiries", icon: Inbox },
  { href: "/aka/logs", label: "Activity log", icon: ScrollText },
];

export function AdminShell({
  email,
  current,
  children,
}: {
  email: string;
  /** Which nav item to mark as active — matched exactly, not by prefix. */
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/aka" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <LogoMark className="size-7" />
            <span className="text-sm">Console</span>
          </Link>

          <nav className="ml-4 flex items-center gap-1" aria-label="Console">
            {nav.map((item) => {
              const active = current === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex h-9 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-foreground"
                      : "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                  }
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-xs font-medium text-muted transition-colors hover:border-brand/50 hover:text-foreground"
              >
                <LogOut className="size-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
    </div>
  );
}
