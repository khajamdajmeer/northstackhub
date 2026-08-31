import Image from "next/image";

import { clients } from "@/content/company";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Sliding strip of companies whose work the studio has delivered on.
 *
 * The marquee is the pattern from `tech-marquee.tsx` — `mask-fade-x` edges, the
 * track duplicated so the `-50%` translate loops without a seam — with two of
 * that component's defects fixed rather than copied:
 *
 *  - Its track is `aria-hidden` with no accessible equivalent, so the content
 *    does not exist for a screen reader. Here the animated copy is hidden and a
 *    real, linked list is rendered for assistive tech and for no-JS/no-CSS.
 *  - Its raw CSS animation ignores the reduced-motion preference. Here the
 *    animation is gated on `motion-safe:`, so `prefers-reduced-motion: reduce`
 *    gets a static wrapping row instead of movement it did not ask for.
 */
export function ClientStrip() {
  // Same contract as `testimonials`: nothing to show means no section at all,
  // rather than a hollow band with a heading over empty space.
  if (clients.length === 0) return null;

  return (
    <section className="border-b border-border py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Clients"
          title="Teams we have built for"
          description="Product and platform work delivered for travel, education and commerce companies, in-house teams and founders."
        />
      </Container>

      {/* Decorative duplicate. The real list is below, visually hidden. */}
      <div
        className="mask-fade-x relative mt-12 flex overflow-hidden py-2"
        aria-hidden
      >
        <ul className="flex shrink-0 items-center gap-3 pr-3 motion-safe:animate-marquee motion-reduce:flex-wrap motion-reduce:justify-center">
          {[...clients, ...clients].map((client, index) => (
            <li
              key={`${client.name}-${index}`}
              className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-card border border-border bg-surface px-5 py-3.5"
            >
              {client.logo ? (
                <Image
                  src={client.logo}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0 rounded-md object-contain"
                />
              ) : (
                // No usable logo file: the initial stands in, so every card has
                // the same shape and the row does not stagger.
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 font-mono text-xs font-semibold text-brand"
                  aria-hidden
                >
                  {client.name.charAt(0)}
                </span>
              )}
              <span className="text-sm font-medium">{client.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The accessible, linked equivalent of the strip above. */}
      <Container>
        <ul className="sr-only">
          {clients.map((client) => (
            <li key={client.name}>
              <a href={client.url} target="_blank" rel="noopener noreferrer">
                {client.name}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
