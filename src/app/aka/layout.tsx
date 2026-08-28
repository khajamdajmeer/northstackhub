import type { Metadata } from "next";

/**
 * The console lives outside the `(site)` group, so it inherits the document
 * shell and theme but none of the marketing navigation.
 */

export const metadata: Metadata = {
  title: {
    default: "Console",
    template: "%s | Console",
  },
  // Belt to the proxy's braces. Neither the console nor its login page should
  // ever appear in an index.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
