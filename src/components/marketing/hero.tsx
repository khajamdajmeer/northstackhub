import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { principles, siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroScene } from "@/components/three/hero-scene";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { Magnetic } from "@/components/motion/magnetic";

const disciplines = [
  "Web applications",
  "Android & iOS",
  "RAG systems",
  "Agentic AI",
  "E-commerce",
  "Learning platforms",
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Decorative only. The copy below is server-rendered and complete without it. */}
      <HeroScene className="pointer-events-none absolute inset-0 -z-10" />
      <div className="glow pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="flex max-w-3xl flex-col items-start gap-7">
          <Reveal>
            <Badge tone="neutral">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              Software studio · Remote-first · Worldwide
            </Badge>
          </Reveal>

          <h1 className="text-[2.75rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            <SplitText as="span" className="block">
              We build software
            </SplitText>
            <SplitText as="span" className="block text-brand" delay={0.12}>
              end to end.
            </SplitText>
          </h1>

          <Reveal delay={0.2}>
            <p className="max-w-2xl text-lg leading-relaxed text-muted text-pretty">
              Web and mobile applications, RAG and agentic AI systems, e-commerce, payments and
              learning platforms. Next.js and React on the front, FastAPI and Node behind it,
              deployed on AWS or Azure and maintained after launch.
            </p>
          </Reveal>

          <Reveal delay={0.28} className="w-full">
            <ul className="flex flex-wrap gap-x-2 gap-y-2">
              {disciplines.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted backdrop-blur-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.34}>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Magnetic>
                <ButtonLink href="/contact" size="lg">
                  Start a project
                  <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="/portfolio" variant="outline" size="lg">
                See the work
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <p className="text-sm text-muted">
              {siteConfig.responseTime} · Free 30-minute scoping call ·{" "}
              <Link href="/pricing" className="text-brand underline-offset-4 hover:underline">
                or start from a fixed-price package
              </Link>
            </p>
          </Reveal>
        </div>
      </Container>

      {/* The three words, stated plainly. The pinned sequence further down earns them. */}
      <div className="relative border-t border-border">
        <Container>
          <ul className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {principles.map((principle) => (
              <li key={principle.word} className="flex items-baseline gap-3 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                <span className="font-mono text-xs text-brand">{principle.index}</span>
                <span className="text-sm font-medium tracking-[0.2em] uppercase">
                  {principle.word}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
