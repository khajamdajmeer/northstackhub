import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { Counter } from "@/components/motion/counter";

export function StatsBand() {
  return (
    <section className="border-b border-border bg-surface/40">
      <Container className="py-14">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {siteConfig.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5">
              <dd className="order-1 font-mono text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
                <Counter value={stat.value} />
              </dd>
              <dt className="order-2 text-sm text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
