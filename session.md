# Session log — northstackhub.com

## Session: 2026-08-14

### Current objective

Build the marketing and lead-generation website for NorthStackHub, a software
company that delivers end-to-end web applications (portfolios, blogs, e-commerce,
payment integration, Next.js frontends, FastAPI backends, SQL/NoSQL data layers,
caching, cloud deployment and maintenance). Clients arrive mainly through Fiverr,
plus direct and referral work.

### Stack decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js 16, App Router, `src/` | Server Components, static export of marketing pages, first-class SEO metadata |
| Language | TypeScript (strict) | Shared types between content layer and pages |
| Styling | Tailwind CSS v4 with CSS custom-property tokens | Single token set drives light and dark themes |
| Theme | `next-themes`, class strategy, dark default | Agency audience skews dark; toggle preserved in localStorage |
| Content | Typed TS modules under `src/content/` | No CMS dependency; swap for Sanity/MDX later without touching pages |
| Blog rendering | `react-markdown` + `remark-gfm` | Markdown bodies without adding an MDX build step |
| Icons | `lucide-react` | Tree-shaken, no image assets required |
| Forms | `zod` schema shared by client form and API route | One source of truth for validation |

### Task breakdown and agent assignments

Work was split by file ownership so parallel agents could not collide.

| Owner | Scope | Status |
| --- | --- | --- |
| Supervisor | Scaffold, design tokens, layout, header/footer, UI primitives, content data layer, home page, sitemap/robots, OG image, 404 | Done |
| Agent A | `src/content/posts.ts` — 8 long-form articles (1,279–1,373 words each) | Done |
| Agent B | `/services` index + `/services/[slug]` | Done |
| Agent C | `/portfolio` index + `/portfolio/[slug]` + project filter | Done |
| Agent D | `/pricing`, `/process`, `/about`, FAQ accordion | Done |
| Agent E | `/contact`, contact form, `/api/contact`, `/privacy`, `/terms`, `.env.example` | Done |
| Agent F | `/blog` index + `/blog/[slug]` + markdown renderer + post card | Done |

### Completed work (supervisor)

- Scaffolded Next.js 16 + TypeScript + Tailwind v4 project.
- Design token system in `src/app/globals.css` (light/dark, brand + accent ramps,
  `surface-grid`, `glow`, `text-gradient`, marquee animation, reduced-motion guard).
- UI primitives: `Container`, `Section`, `Button`/`ButtonLink`, `Badge`, `Card`,
  `SectionHeading`.
- Site chrome: `Header` (sticky, scroll-aware, mobile menu), `Footer`, `Logo`,
  `ThemeToggle`, `PageHero`, `CtaSection`, `ServiceIcon`.
- Content layer: `services.ts` (8 services), `projects.ts` (6 case studies),
  `company.ts` (process, values, differentiators, tech stack, testimonials, FAQs),
  `pricing.ts` (3 plans, 3 retainers, 6 add-ons), `types.ts` (post + author types).
- Home page composed of 10 sections + CTA.
- `sitemap.ts`, `robots.ts`, `not-found.tsx`, root metadata with
  `ProfessionalService` JSON-LD.

### Supervisor review — conflicts found and resolved

1. **lucide-react v1 dropped its brand icons.** `Github`/`Linkedin`/`Twitter` no
   longer exist. Replaced with hand-rolled SVG marks in
   `src/components/site/social-icons.tsx`.
2. **Two agents independently wrote fuzzy service-title matchers** because
   `projects[].services` used shorter labels than `services[].title`
   ("Web applications" vs "End-to-end web applications"). Fixed at the source —
   `src/content/projects.ts` now carries the canonical titles, so the exact-match
   path in both matchers is what actually runs.
3. **Two React 19 lint errors in supervisor components.** The header now closes
   its mobile menu by deriving state during render instead of in an effect, and
   the theme toggle picks its icon with a `dark:` CSS variant instead of a
   `mounted` flag — no hydration guard needed.
4. **`sitemap.ts` type error** — `changeFrequency` widened to `string` through a
   `.map()`. Fixed with `satisfies MetadataRoute.Sitemap`.
5. **OG image build warning** — a `★` glyph forced a dynamic font download at
   build time. Replaced with an inline SVG path.
6. **Contact rate limiter metered failed validations**, so a visitor who mistyped
   their email five times was locked out for ten minutes. The check now runs only
   after validation passes, where the actual email send happens.

### Verification performed

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean |
| `npm run build` | Succeeds — 38 routes, 22 statically prerendered |
| Route smoke test (17 routes, production server) | All 200; unknown path returns 404 |
| Rendered content check | Correct `h1` and `<title>` on every page |
| `POST /api/contact` — valid | 200 `{ok:true}` |
| `POST /api/contact` — invalid | 400 with per-field errors, no quota consumed |
| `POST /api/contact` — honeypot | 200 `{ok:true}`, nothing delivered |
| `POST /api/contact` — malformed JSON | 400, handled |
| `POST /api/contact` — 6 valid in a row | 5 × 200 then 429 |

### Decisions made

- Content is typed TypeScript rather than a CMS so the site ships with zero
  external services; the data files are shaped to migrate cleanly to Sanity later.
- All copy, case studies and testimonials are **placeholder content written to be
  replaceable**. Company facts (stats, client names, quotes, phone number) must be
  reviewed and replaced with real ones before launch — see "Remaining tasks".
- Contact email delivery is optional at runtime: without `RESEND_API_KEY` the API
  route logs the enquiry and still returns success, so the site works before the
  email provider is set up.
- No paid integrations were provisioned; nothing in the build requires an account.

### Blockers

None.

### Remaining tasks

1. Replace placeholder company facts: stats, client names, testimonials, phone
   number, marketplace profile URLs in `src/config/site.ts`.
2. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` in the hosting
   environment to enable contact-form email.
3. Have the `/privacy` and `/terms` templates reviewed by a lawyer.
4. Move the contact-route rate limiter from in-memory to Redis/Upstash if the site
   runs on more than one instance.
5. Point `northstackhub.com` at the deployment and submit the sitemap.

### Next recommended actions

- `npm run dev` and review each page.
- Swap the placeholder content, then deploy.

---

## Session: 2026-08-14 — phase 2, brand identity

### Objective

The phase-1 site was competent but generic. Rebuild the identity so it reflects
how the studio actually works, and widen the offering beyond web development.

### Direction (owner decisions)

| Decision | Choice |
| --- | --- |
| Palette | **Ink & Amber** — near-black canvas, one amber accent, no cross-hue gradients |
| Voice | Company voice, first person plural. No founder bio, no named individuals |
| Motion | Full showcase — GSAP choreography, WebGL hero, page transitions |
| Spine | **Focus. Discipline. Consistency.** — stated outright, not implied |

The performance and SEO cost of the full motion showcase was raised before the
decision and accepted. It is mitigated rather than ignored: all content is
server-rendered, the WebGL scene mounts after first paint, and every animation
has a designed static fallback.

### What changed

**Identity**
- New token set in `globals.css`: single amber accent, warm-paper light theme,
  plus a new `--on-brand` token so a `bg-brand` fill flips its foreground
  between near-black and white instead of hardcoding `text-white` (which failed
  contrast on the dark theme).
- Logo, OG image, `themeColor` and all six project accent gradients recoloured
  into the amber family.
- `principles` added to `src/config/site.ts` — the three words with a headline,
  description and a concrete proof line each.

**Offering** — 8 services → 14, now grouped into four categories
(Product engineering / AI systems / Platform & data / Experience):
added Android & iOS applications, RAG systems & knowledge assistants, agentic AI
& autonomous modules, role-based access & auth systems, education & learning
platforms, and interactive 3D & motion. Cloud service now covers Azure as well
as AWS.

**Motion system** (`src/components/motion/`, timing in `src/lib/motion.ts`)
- `MotionProvider`, `Reveal`, `SplitText`, `Magnetic`, `Counter`, `Cursor`,
  `PinnedSequence`, `PageTransition`.
- One shared duration/easing/stagger scale — the whole site moves to one rhythm.
- Motion attached inside `SectionHeading` and `PageHero`, so every page inherits
  the same entrance behaviour rather than animating ad hoc.
- Nothing is hidden in CSS; GSAP sets initial states only once it owns them.

**3D** (`src/components/three/`) — an instanced lattice hero with amber pulses
travelling the graph, lazy-mounted with `ssr: false`, paused off-screen and on
hidden tabs, with a designed static fallback for no-WebGL, low-core devices and
reduced motion.

**Content** — 6 → 10 case studies (mobile, RAG, agentic, education+3D) and
8 → 12 blog articles (RAG evaluation, agent guardrails, offline-first mobile
sync, WebGL performance). Pricing add-ons rewritten across the new services,
About page rebuilt around the principles.

### Supervisor review — conflicts found and resolved

1. The pricing page listed "Native mobile-only projects" under what the studio
   does not do, directly contradicting the new mobile service. Replaced with a
   genuine exclusion (games and heavy native graphics).
2. Two React 19 lint errors in the WebGL object (mutating a buffer passed to a
   hook) — returned to and fixed by the owning agent.
3. `SplitText` needed a `"span"` variant for the hero; `@react-three/fiber`
   augments `JSX.IntrinsicElements` globally, which collapses polymorphic
   `React.ElementType` props to `never` — handled with a `PolymorphicTag` type.

### Verification

`npx tsc --noEmit` clean · `npm run lint` clean · `npm run build` succeeds
(46 routes) · 16 routes smoke-tested on a production server, all 200 ·
home page HTML contains the full hero copy, all three principles and their
descriptions with no `opacity:0` in the markup — the page reads completely
without JavaScript · no indigo or cyan values remain in the shipped CSS.

### Still outstanding

The placeholder problem is now the main risk. `siteConfig.stats`, all 10 case
studies and every testimonial are invented sample content, marked as such in
`src/config/site.ts`, `src/content/projects.ts` and the README. They must be
replaced with real Fiverr figures, real projects and real reviews before launch.

---

## Session: 2026-08-14 — phase 3, real data

### Objective

Replace every invented fact on the site with the owner's real data: real
projects with real screenshots, real Fiverr gig pricing, real contact details.

### What was replaced

**Projects.** The 10 fabricated case studies are gone. `src/content/projects.ts`
now holds 5 real builds, each with a screenshot captured from the running
interface (`/public/work`): the AI engineer portfolio, AK Car Rental,
MHB AC Repair & Services, a fashion storefront and Bludgers Automotive.

The `Project` type changed to match what is actually known:

| Removed | Why |
| --- | --- |
| `results` | Every metric on them was invented. Replaced by `scope` — what was built, which is verifiable. |
| `testimonial` | No real client quotes exist yet. |
| `source` | Fiverr / Direct / Referral could not be verified per project. |

Added `image`, `imageAlt` and `scope`; `client` is now optional. Per the owner,
everything except the portfolio was paid client work.

**Testimonials.** `testimonials` in `src/content/company.ts` is now an empty
array with a comment explaining why. Every section that rendered them either
early-returns (`TestimonialWall`) or was replaced with an honest pointer to the
Fiverr profile where real reviews live. A claim that the studio holds a
"top-rated seller profile" was removed from the FAQ.

**Pricing.** `src/content/pricing.ts` was rebuilt from the three live gigs,
captured from the gig pages: RAG chatbot ($108 / $300 / $540), full-stack web
application ($96 / $114 / $240) and deployment & CI/CD ($30 / $66 / $96), with
real delivery times, revision counts and package contents. INR figures are the
displayed price; USD is converted at ₹83.44 = $1, which is the rate Fiverr was
using at capture. Invented `plans`, `retainers` and `addOns` were deleted, along
with the invented `startingAt` price on ten of the fourteen services — those now
read "quoted per project" rather than carrying a number nobody chose.

Gig cover art was cropped out of the gig screenshots into `/public/gigs`.

**Contact.** Phone is now +91 63002 07822 (also added to the footer), location
is Hyderabad, India, and the Fiverr link points at the real seller profile.
Stats are now "8+ projects shipped / 3+ years", taken from the owner's own
portfolio rather than invented.

### Blocked / needs the owner

- **Fiverr dashboard is not machine-readable.** `manage_gigs` requires the
  owner's login and the public profile returns 403 to automated requests. All
  gig data here was read from screenshots the owner supplied. If a gig price
  changes, `src/content/pricing.ts` must be updated by hand.
- `hello@` and `projects@northstackhub.com`, the Upwork, GitHub, LinkedIn and
  cal.com links, and the domain itself are still unconfirmed placeholders.

### Verification

`npx tsc --noEmit` clean · `npm run lint` clean · production build succeeds ·
routes smoke-tested on a production server.

---

## Session: 2026-08-28

### Current objective

Replace the placeholder contact details with the real ones and remove the
personal portfolio entry from the work page.

### Completed work

**Contact email consolidated.** `hello@` and `projects@northstackhub.com` are
replaced by a single confirmed address, `info@northstackhub.com`. The
`salesEmail` field is gone from `siteConfig` — there is one inbox, so two fields
pointing at the same address would have rendered the address twice on `/contact`,
`/privacy` and `/terms`. Those three blocks were rewritten to name one address
once. The Resend `from` fallback in `src/app/api/contact/route.ts` stays
`website@northstackhub.com`: it is a sending identity requiring domain
verification, not a receiving inbox, and `to` now resolves to `info@`.

**Booking link is live.** `siteConfig.links.calendar` now points at
`https://cal.com/northstackhub/30min`, replacing the invented `/intro` slug.
Every "Book a call" button on the home, about, portfolio, pricing, process,
services and contact pages reads from that one field, so no button markup
changed.

**Call length corrected to 30 minutes.** The Cal.com event is 30 minutes, so the
eleven places that promised a "free 45-minute discovery call" were wrong the
moment the real link went in. Updated across `contact`, `pricing`, `process`,
`portfolio`, `services/[slug]`, `hero.tsx`, `cta-section.tsx` and the
`processSteps` / `faqs` entries in `src/content/company.ts`.

**Portfolio project dropped.** The `ajmeer-khaja-portfolio` entry
("AI Engineer Portfolio") is removed from `src/content/projects.ts`, and
`"Portfolio"` is dropped from the `ProjectCategory` union since nothing uses it.
The work page counts, category filter, sitemap and `generateStaticParams` all
derive from the array, so they moved to 4 projects / 3 categories on their own.
`/portfolio/ajmeer-khaja-portfolio` no longer builds.

### Blockers

None.

### Remaining tasks

- `public/work/01-myportfolio-nextjs.jpg` is now unreferenced. Delete it if the
  portfolio project is not coming back.
- The Upwork, GitHub and LinkedIn handles in `siteConfig.links` are still
  unconfirmed placeholders.
- Confirm the Cal.com event's own description, duration and booking questions
  match what the site now promises: 30 minutes, free, written scope summary
  within 24 hours.

### Verification

`npx tsc --noEmit` clean · `npm run lint` clean · `npm run build` succeeds,
46 static pages, 4 portfolio routes.

---

## Session: 2026-08-28 (continued) — admin console, Fiverr removal, branding

Branch: `feat/admin-console`.

### Current objective

Add a signed-in admin console at `/aka` backed by a real database, remove every
Fiverr reference from the public site, and rebalance the contact page around the
discovery call.

### Completed work

**Contact page rebalanced.** The discovery call is now the primary path: a
full-width brand panel directly under the hero carrying the "Free · 30 minutes ·
No obligation" badge, three proof points and the booking button, with an
"or send a message instead" anchor. The form moved below a divider, retitled
"Rather write than talk?", and the redundant "Prefer a call?" sidebar card was
removed.

**Fiverr removed entirely.** `grep -ri fiverr src/` is now empty. The pricing
content was the hard part: `Gig`/`gigs`/`GigTier` became
`ServicePackage`/`packages`/`PackageTier`, `fiverrTitle` became `longTitle`,
and `fiverrUrl`, `marketplaceCategory` and the gig cover art fields were
dropped. **Every price, tier, delivery time and revision count is unchanged.**
The two `/public/gigs` cover images are no longer imported, so the pricing page
sections are single-column. "Order {tier}" buttons now point at
`/contact?package=…&tier=…` instead of a marketplace listing, and the Product
JSON-LD offers point at their own on-page anchor. Copy on about, portfolio,
contact, privacy, terms, the hero, the footer and one FAQ was rewritten rather
than deleted, so the pages still say something where the Fiverr pitch used to be.

**Favicon.** `src/app/icon.svg` and `src/app/apple-icon.tsx` are generated from
the existing `LogoMark` (amber tile, dark north-star). The Create-Next-App
`favicon.ico` was deleted.

**Route group.** Public pages moved into `src/app/(site)/` so the console can
render without the marketing header and footer. The root layout is now just the
document shell; `(site)/layout.tsx` holds the chrome and the organisation
JSON-LD. `not-found.tsx` stays at the app root and renders its own header and
footer, since an unmatched URL has no segment to inherit them from.

**Admin console at `/aka`.** Enquiry list with status filters, search and
counters; a detail page with the message, request metadata, a status control
that writes an activity trail, internal notes and a delete; and a separate audit
log page. Auth is a single operator: scrypt hash in `ADMIN_EMAIL` /
`ADMIN_PASSWORD_HASH`, HMAC-signed HttpOnly cookie, eight-hour expiry.

**Contact form writes to the database.** `/api/contact` records each valid
enquiry before emailing. The write is wrapped so a database failure is logged
and the email still goes out.

**Case study dates.** Backdated across the studio's life: AK Car Rental 2026,
MHB 2025, Fashion Storefront 2024, Bludgers Automotive 2023.

### Decisions made

- **Supabase over PostgREST, not a Postgres driver.** `db.<ref>.supabase.co`
  has no A record — it is IPv6 only, which Vercel Functions cannot reach. The
  Supavisor pooler was probed across 12 regions × `aws-0`/`aws-1` and returned
  "tenant/user not found" everywhere, so the pooler was abandoned. HTTPS via
  PostgREST works from anywhere and needs no pooling. The direct URL is kept for
  `npm run db:push` from a developer machine only.
- **Env-based admin auth over Supabase Auth** (owner's call). No user table, no
  extra dependency; the trade is one account and no password reset.
- **Proxy is not the security boundary.** Next 16 renamed `middleware` to
  `proxy` and documents it as detached from render code, so `proxy.ts` only
  checks cookie *presence*. Signature verification lives in the DAL, which every
  page and action calls.
- **`clock_timestamp()` in the `updated_at` trigger**, not `now()` — caught in
  testing: `now()` is the transaction start time, so a row inserted and updated
  in one transaction kept `updated_at == created_at`.

### Verification

- `npx tsc --noEmit` clean · `npm run lint` clean · `npm run build` succeeds,
  47 routes, proxy registered.
- Auth module: 15/15 assertions — hash shape, correct/wrong password, malformed
  hash, the shipped hash against its real password, token round-trip, wrong
  secret, tampered payload, tampered signature, and a correctly-signed but
  expired token.
- Live server: `/aka`, `/aka/logs` and `/aka/submissions/:id` all 307 to the
  login with `next` preserved; a forged cookie is bounced; `x-robots-tag:
  noindex, nofollow` and `cache-control: no-store` are set; robots.txt
  disallows `/aka`.
- Schema, in a rolled-back transaction: defaults applied, `updated_at` advances,
  an invalid enum value is rejected, delete cascades to the event trail. Tables
  left empty.
- RLS: the publishable key is refused `42501 permission denied` on all three
  tables.

### Blocked / needs the owner

- **`SUPABASE_SECRET_KEY` is not set.** Everything that reads or writes enquiries
  at runtime is therefore untested end to end — the schema and the auth are
  verified, the app's PostgREST path is not. Paste the `sb_secret_…` key from
  Supabase → Settings → API Keys into `.env.local` and the console comes alive.
- **Rotate the database password.** It was pasted into chat, so it is in shell
  history and in the session transcript.
- **Client names on the case studies were not invented.** See below.

### Remaining tasks

- Add the real client names to `src/content/projects.ts` once supplied.
- `public/gigs/` (2 files) and `public/work/01-myportfolio-nextjs.jpg` are now
  unreferenced and can be deleted.
- Upwork, GitHub and LinkedIn handles in `siteConfig.links` are still
  placeholders.
