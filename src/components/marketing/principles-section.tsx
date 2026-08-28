import { PinnedSequence } from "@/components/motion/pinned-sequence";

/**
 * The three words are the studio's whole pitch, so they get their own pinned
 * scroll sequence rather than a row of cards. Without JavaScript or under
 * reduced motion, PinnedSequence renders all three as a static section.
 */
export function PrinciplesSection() {
  return (
    <section id="principles" className="border-y border-border bg-surface/40">
      <PinnedSequence />
    </section>
  );
}
