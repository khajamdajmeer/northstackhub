import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Reveal } from "@/components/motion/reveal";

/**
 * Motion lives here rather than in every page: one entrance rhythm for every
 * section heading on the site. Content is server-rendered inside Reveal, so it
 * is present and readable whether or not the animation ever runs.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      stagger={0.08}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl items-start",
        className,
      )}
    >
      {eyebrow ? <Badge tone="neutral">{eyebrow}</Badge> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description ? (
        <p className="text-base leading-relaxed text-muted text-pretty sm:text-lg">{description}</p>
      ) : null}
    </Reveal>
  );
}
