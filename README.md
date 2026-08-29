# northstackhub.com

Marketing and lead-generation site for **NorthStackHub** — a software studio that
builds products end to end: web applications, Android and iOS apps, RAG and
agentic AI systems, e-commerce, payments, role-based platforms, learning
products, portfolios and blogs, plus the cloud deployment and maintenance
underneath them.

The studio runs on three promises, and the site is built to argue for them
rather than just print them: **One at a time. Built to last. No chasing.**
Each one carries a `proof` field, because a promise nobody can check is a
slogan.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 with CSS custom-property design tokens |
| Theming | `next-themes`, class strategy, dark default with a light toggle |
| Motion | GSAP 3 + ScrollTrigger + SplitText via `@gsap/react` |
| 3D | three.js with React Three Fiber and drei, lazily mounted |
| Content | Typed TypeScript modules under `src/content/` |
| Blog | Markdown bodies rendered with `react-markdown` + `remark-gfm` |
| Icons | `lucide-react` (brand marks hand-rolled — lucide v1 dropped them) |
| Forms | `zod` schema shared by the client form and the API route |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: only needed for contact-form email
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npx tsc --noEmit  # typecheck
```

## Project structure

```
src/
  proxy.ts                  optimistic auth gate for /aka (Next 16 renamed
                            `middleware` to `proxy`)
  app/
    layout.tsx              document shell: fonts, theme, site-wide metadata
    icon.svg  apple-icon.tsx  favicon and iOS icon, from the NorthStackHub mark
    (site)/                 the public marketing site
      layout.tsx            header, footer, page transitions, JSON-LD
      page.tsx              home
      services/             index + [slug] detail
      portfolio/            case-study index + [slug] detail
      blog/                 index (?category= filter) + [slug] article
      pricing/  process/  about/  contact/  privacy/  terms/
    aka/                    admin console — signed-in only, noindex
      login/                sign-in page and its server actions
      page.tsx              enquiry list, filters, search, counters
      submissions/[slug]/   one enquiry: status, notes, activity trail
      logs/                 admin audit log
      actions.ts            status/notes/delete server actions
    api/contact/route.ts    contact form handler
    sitemap.ts  robots.ts  not-found.tsx
  components/
    ui/                     Container, Button, Badge, Card, SectionHeading
    site/                   Header, Footer, Logo, PageHero, CtaSection, ContactForm
    admin/                  console shell, status badge, submission controls
    marketing/              home-page sections + project grid + FAQ accordion
    motion/                 GSAP primitives (Reveal, SplitText, PinnedSequence…)
    three/                  WebGL hero scene + capability detection
    blog/                   markdown renderer, post card
  content/                  services, projects, posts, company, pricing, types
  config/site.ts            company facts, navigation, social links, principles
  lib/
    admin/                  auth, DAL, queries, status model
    supabase.ts             server-side client (secret key, never bundled)
    ...                     utils, motion timing, contact schema
supabase/schema.sql         tables, indexes, trigger and RLS for the console
scripts/hash-password.mjs   generates ADMIN_PASSWORD_HASH + ADMIN_SESSION_SECRET
```

## Editing content

All copy lives in typed modules, so there is no CMS to log into and the build
fails loudly if a field is missing.

| File | Holds |
| --- | --- |
| `src/config/site.ts` | Company name, email, phone, hours, stats, social links, navigation, and the three `principles` |
| `src/content/services.ts` | The 14 services — summary, outcomes, deliverables, stack, timeline, optional price, FAQs |
| `src/content/projects.ts` | Real projects — challenge, approach, delivered scope, stack, screenshot |
| `src/content/posts.ts` | Blog articles, bodies in GitHub-flavoured Markdown |
| `src/content/company.ts` | Process steps, values, differentiators, tech stack, testimonials, FAQs |
| `src/content/pricing.ts` | The fixed-scope packages and their tiers |

Adding a service, project or post is a matter of appending one object — routing,
sitemap entries, related-content links and metadata all derive from these arrays.

### What is real, and what is not

The site deliberately carries no invented facts. Three rules hold it that way:

- **Projects are real builds.** Every entry in `projects.ts` has a screenshot of
  the running interface in `/public/work`. Entries carry `scope` (what was
  built) rather than results, because the outcomes were never measured. No live
  URLs are published.
- **Prices are real quotes.** `pricing.ts` holds the fixed-scope packages —
  names, prices, delivery days, revisions and contents. **If a package price
  changes, change it here in the same sitting.** A client comparing this page to
  their quote should never find a difference. Services with no matching package
  carry no price and say so.
- **There are no testimonials.** `testimonials` in `company.ts` is an empty
  array on purpose; the sections that consume it disappear until real reviews
  are added. The site offers a reference on request instead.

> **Still to confirm before launch:** the Upwork, GitHub and LinkedIn links in
> `siteConfig.links` — all still placeholders. Have `/privacy` and `/terms`
> reviewed by a lawyer.

## Design system — Ink & Amber

One accent, used sparingly. Type and spacing carry the page; amber appears only
where the eye is meant to go — a primary action, an active state, a number that
matters.

| Token | Dark (identity) | Light |
| --- | --- | --- |
| `background` | `#08090b` | `#faf8f5` |
| `surface` | `#101216` | `#ffffff` |
| `foreground` | `#f2f3f5` | `#101010` |
| `muted` | `#8b9099` | `#605c56` |
| `border` | `#1e2127` | `#e4e0d9` |
| `brand` | `#f5a524` | `#9a5b00` |
| `on-brand` | `#08090b` | `#ffffff` |

Colours are defined once in `src/app/globals.css` and exposed to Tailwind through
`@theme inline`. Components use semantic classes only — `bg-surface`,
`text-muted`, `border-border`, `text-brand` — never raw palette colours, so
re-theming means editing one block of variables.

`on-brand` matters: a `bg-brand` fill flips its foreground between near-black and
white with the theme. Never hardcode `text-white` on a brand fill.

Custom utilities: `.text-gradient`, `.surface-grid`, `.glow`, `.mask-fade-x`,
`.rule-fade`, plus `animate-marquee` and `animate-fade-up`.

## Motion and 3D

The studio sells GSAP and three.js work, so the site is its own demo — but it is
built to a budget.

- Timing lives in `src/lib/motion.ts` — one duration, easing and stagger scale
  shared by every animation, so the whole site moves with the same rhythm.
- `src/components/motion/` holds the primitives: `Reveal`, `SplitText`,
  `Magnetic`, `Counter`, `Cursor`, `PinnedSequence`, `PageTransition`.
- Motion is attached in the shared `SectionHeading` and `PageHero`, so every page
  inherits the same entrance behaviour instead of animating ad hoc.
- **Nothing is hidden in CSS.** GSAP sets initial states itself once it has taken
  ownership, so a crawler or a visitor without JavaScript sees a complete page.
- `prefers-reduced-motion` is honoured through `gsap.matchMedia()`; elements are
  left in their final state rather than animated.
- The WebGL hero is `next/dynamic` with `ssr: false`, mounts after first paint,
  pauses off-screen and when the tab is hidden, and degrades to a designed static
  composition with no WebGL, on low-core devices, or under reduced motion.

## Contact form

`POST /api/contact` validates with the shared zod schema, rejects honeypot
submissions silently, and applies a per-IP rate limit.

Email delivery is optional. Set `RESEND_API_KEY` and the enquiry is sent through
Resend's REST API; leave it unset and the route logs the enquiry server-side and
still returns success, so the site works before an email provider is configured.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | No | Enables email delivery of enquiries |
| `CONTACT_TO_EMAIL` | No | Where enquiries are sent (defaults to `siteConfig.email`) |
| `CONTACT_FROM_EMAIL` | No | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL override for previews |

Every valid enquiry is also written to Supabase before the email goes out, so it
appears in the console at `/aka`. The two paths are independent: a database
write that fails is logged and the email still sends, and with no database
configured the form behaves exactly as it did before.

The rate limiter is in-memory: it resets on cold start and is per-instance. Move
it to Redis or Upstash before running on more than one instance.

## Admin console (`/aka`)

Sign-in-only dashboard for the enquiries the contact form collects: filter and
search them, move them through a status pipeline, keep internal notes, and read
an audit log of every sign-in and change.

### Setup

1. **Database.** Create a Supabase project, then apply the schema:

   ```bash
   SUPABASE_DB_URL='postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres' \
     npm run db:push
   ```

2. **Credentials.** Generate the password hash and session secret:

   ```bash
   npm run admin:hash -- '<a long password>'
   ```

   Paste both lines into `.env.local` and into the Vercel project's environment
   variables. The plaintext password is never stored anywhere.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | For the console | Project URL |
| `SUPABASE_SECRET_KEY` | For the console | `sb_secret_…` key. Server-side only — it bypasses RLS |
| `SUPABASE_DB_URL` | Local only | Direct Postgres URL, used by `npm run db:push` |
| `ADMIN_EMAIL` | Yes | The one account that can sign in |
| `ADMIN_PASSWORD_HASH` | Yes | scrypt hash from `npm run admin:hash` |
| `ADMIN_SESSION_SECRET` | Yes | Signs the session cookie |

### How the auth works

One operator, so there is no user table. The password is an scrypt hash in the
environment and the session is an HMAC-signed, HttpOnly cookie that expires
after eight hours. Rotating `ADMIN_SESSION_SECRET` signs everyone out
immediately.

`proxy.ts` only checks whether a session cookie is *present* — it never verifies
the signature, because Next's docs are explicit that proxy runs detached from
render code and may be served from the CDN. The real check is
`requireSession()` in `src/lib/admin/dal.ts`, which every console page and every
server action calls. Server Actions are public HTTP endpoints, so each one
re-authorizes rather than trusting the page it was rendered on.

### Why the REST client and not a Postgres driver

The project's `db.<ref>.supabase.co` host resolves to IPv6 only, which Vercel
Functions cannot dial. All runtime access goes over PostgREST via HTTPS
instead, which also removes any connection-pooling concern. The direct URL is
used only from a developer machine, by `npm run db:push`.

### Data protection

Every table has RLS enabled with no policy attached, and `anon` /
`authenticated` are revoked outright. Only the secret key reaches the data —
verified: a request with the publishable key is refused with `42501 permission
denied` on all three tables.

## SEO

- Per-page `metadata` with canonical URLs, Open Graph and Twitter cards
- `ProfessionalService` JSON-LD site-wide, `FAQPage` on services and pricing,
  `BlogPosting` on articles, `ContactPage` on contact
- Generated `sitemap.xml` and `robots.txt` covering every static and dynamic route
- Service, project and blog pages are statically generated via `generateStaticParams`

## Deployment

Deploys to Vercel with no configuration — push the repository and import it, or:

```bash
npx vercel        # preview
npx vercel --prod # production
```

Set the environment variables in the project settings, point
`northstackhub.com` at the deployment, then submit `sitemap.xml` in Search Console.
Any Node host works too: `npm run build && npm run start`.
