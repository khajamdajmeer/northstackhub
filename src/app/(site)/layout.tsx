import { siteConfig } from "@/config/site";
import { MotionProvider } from "@/components/motion/motion-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { Cursor } from "@/components/motion/cursor";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

/**
 * Chrome for the public marketing site. Everything under `/aka` sits outside
 * this group and renders without it.
 */

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  description: siteConfig.description,
  areaServed: "Worldwide",
  serviceType: [
    "Web application development",
    "Android and iOS application development",
    "RAG and knowledge assistant systems",
    "Agentic AI and autonomous agent modules",
    "E-commerce development",
    "Payment integration",
    "Role-based access control systems",
    "Backend and API development",
    "Education and learning platform development",
    "Interactive 3D and web animation",
    "Cloud deployment and DevOps",
    "Website maintenance",
  ],
  sameAs: [siteConfig.links.github, siteConfig.links.linkedin, siteConfig.links.x],
};

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <MotionProvider>
        <Cursor />
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main id="main" className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </div>
      </MotionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
