import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Hero } from "@/components/marketing/hero";
import { StatsBand } from "@/components/marketing/stats-band";
import { PrinciplesSection } from "@/components/marketing/principles-section";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { WorkPreview } from "@/components/marketing/work-preview";
import { WhyUs } from "@/components/marketing/why-us";
import { ProcessPreview } from "@/components/marketing/process-preview";
import { TechMarquee } from "@/components/marketing/tech-marquee";
import { EngagementModels } from "@/components/marketing/engagement-models";
import { TestimonialWall } from "@/components/marketing/testimonial-wall";
import { LatestPosts } from "@/components/marketing/latest-posts";
import { CtaSection } from "@/components/site/cta-section";

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s | NorthStackHub" template,
  // which would otherwise append the studio name to a title that already opens
  // with it — 72 characters, and the tail truncated in search results.
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <PrinciplesSection />
      <ServicesOverview />
      <WorkPreview />
      <WhyUs />
      <ProcessPreview />
      <TechMarquee />
      <EngagementModels />
      <TestimonialWall />
      <LatestPosts />
      <CtaSection />
    </>
  );
}
