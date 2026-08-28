import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerNav, siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { GithubIcon, LinkedinIcon, XIcon } from "./social-icons";
import { Logo } from "./logo";

const socials = [
  { label: "GitHub", href: siteConfig.links.github, Icon: GithubIcon },
  { label: "LinkedIn", href: siteConfig.links.linkedin, Icon: LinkedinIcon },
  { label: "X", href: siteConfig.links.x, Icon: XIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <Container className="py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_2.2fr]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.description}
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Mail className="size-4" aria-hidden />
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="size-4" aria-hidden />
                {siteConfig.phone}
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" aria-hidden />
                {siteConfig.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-brand/50 hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerNav.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-foreground"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>{siteConfig.hours}</p>
        </div>
      </Container>
    </footer>
  );
}
