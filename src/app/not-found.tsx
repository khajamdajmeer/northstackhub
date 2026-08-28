import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import Link from "next/link";

/**
 * Global 404. Renders its own header and footer because it sits at the app
 * root, outside the `(site)` group that normally supplies them — an unmatched
 * URL has no segment to inherit chrome from.
 */

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="glow pointer-events-none absolute inset-0" aria-hidden />
          <Container className="relative flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
            <span className="font-mono text-sm text-brand">404</span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              That page does not exist
            </h1>
            <p className="max-w-md text-muted text-pretty">
              The link may be out of date, or the page may have moved. Here is where
              everything else lives.
            </p>
            <nav aria-label="Site sections" className="flex flex-wrap justify-center gap-2">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-brand/50 hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <ButtonLink href="/" size="lg" className="mt-2">
              Back to home
            </ButtonLink>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
