/**
 * Real work. Every entry corresponds to a project that exists, and each
 * screenshot in /public/work is a capture of the real build.
 *
 * Two deliberate omissions:
 *  - No live URLs. The work is shown, not linked out to.
 *  - No invented metrics or client testimonials. Where an outcome was not
 *    measured, the page states what was built rather than guessing at what it
 *    achieved.
 */

export type ProjectCategory = "Business site" | "E-commerce" | "Web app";

export type Project = {
  slug: string;
  name: string;
  /** Present only where the project was built for a named business. */
  client?: string;
  category: ProjectCategory;
  year: number;
  /** Screenshot of the real build, served from /public/work. */
  image: string;
  imageAlt: string;
  summary: string;
  challenge: string;
  approach: string[];
  /** What was actually built and shipped — factual, not a claimed outcome. */
  scope: string[];
  stack: string[];
  services: string[];
  duration: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "ak-car-rental",
    name: "AK Car Rental",
    client: "AK Car Rental",
    category: "Web app",
    year: 2026,
    image: "/work/05-carrental.jpg",
    imageAlt:
      "Car rental homepage with a 'Plan Big on Our Rental Service' hero, a red hatchback, and a 'Book a Car' form with car type, pick-up and drop-off location and date fields.",
    summary:
      "A car rental booking platform — accounts, a vehicle catalogue, and a booking form that captures type, locations and dates in a single pass.",
    challenge:
      "Rental enquiries were arriving by phone and message, so availability was checked by hand and the same five questions were asked every time. Reducing a booking to one form and one confirmation removes most of that work.",
    approach: [
      "Put the entire booking intent in one form — vehicle type, pick-up and drop-off location, and both dates — so nobody hits a second step to answer an obvious question",
      "Kept pick-up and drop-off separate rather than assuming a round trip, because one-way rentals price differently",
      "Used native date inputs, so mobile gets the operating system's date picker instead of a fragile custom calendar",
      "Added registration and sign in so repeat customers do not retype their details on every booking",
      "Gave the vehicle catalogue its own route, so a customer can browse first and book second",
    ],
    scope: [
      "Booking form: vehicle type, pick-up and drop-off location, date range",
      "User registration and sign in",
      "Vehicle model catalogue",
      "About and contact pages",
      "Responsive layout across mobile and desktop",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "Bootstrap"],
    services: ["End-to-end web applications", "Backend & API engineering"],
    duration: "Client project",
    accent: "from-orange-500/20 to-amber-300/10",
  },
  {
    slug: "mhb-ac-repair-services",
    name: "MHB AC Repair & Services",
    client: "MHB AC Repairs & Services",
    category: "Business site",
    year: 2025,
    image: "/work/02-mhb-services.jpg",
    imageAlt:
      "AC repair service website with call-for-service numbers in the header, a hero photograph of a technician servicing an air conditioner, and a 'Book Service Now' form with name, mobile number and location fields.",
    summary:
      "A service business site built around one job: turn a visitor into a booked call-out, on a phone, in under a minute.",
    challenge:
      "A local repair business lives on inbound calls, and its customers are usually standing next to a broken appliance on a mobile connection. A site that makes them hunt for a number, or asks for an email they will not check, loses the job to whoever answers first.",
    approach: [
      "Pinned both service numbers and the email into the header, tap-to-call on mobile, so the fastest path is never more than one tap",
      "Placed the booking form directly under the hero instead of on a separate contact page — the visitor books on the page they landed on",
      "Held the form to three fields, name, mobile and location, because every extra field on a mobile enquiry form costs completions",
      "Made location a select rather than free text, so jobs arrive already sorted into serviceable areas",
      "Led with a photograph of the actual work rather than stock iconography, since trust is the whole sale for a home visit",
    ],
    scope: [
      "Booking form with name, mobile number and service location",
      "Click-to-call service and office numbers in the header",
      "Service listing and about pages",
      "Enquiry routing to the business inbox",
      "Mobile-first layout, since most traffic arrives on a phone",
    ],
    stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "PHP"],
    services: ["Portfolios, blogs & marketing sites"],
    duration: "Client project",
    accent: "from-amber-600/20 to-stone-500/10",
  },
  {
    slug: "fashion-storefront",
    name: "Fashion Storefront",
    category: "E-commerce",
    year: 2024,
    image: "/work/03-ecommerce.jpg",
    imageAlt:
      "Clothing e-commerce homepage with a dark editorial hero collage, a cart counter in the navigation, and a 'Best Sellers' product carousel.",
    summary:
      "A clothing storefront with category browsing, a cart that survives navigation, and a best-sellers carousel on the landing page.",
    challenge:
      "A fashion storefront is judged on the first screen. The product grid has to feel like a shop rather than a spreadsheet, while the cart still has to survive a customer wandering between categories and coming back.",
    approach: [
      "Opened with an editorial collage rather than a single banner, so the landing page reads as a brand instead of a catalogue index",
      "Kept the cart count visible in the navigation on every route, so the basket is never something the customer has to go looking for",
      "Put best sellers in a horizontal carousel above the fold — on a first visit it is the highest-intent row on the page",
      "Held cart state outside the page components so it survives navigation between categories",
      "Built the product card once and reused it in the carousel and the category grid, so spacing and typography stay identical",
    ],
    scope: [
      "Category browsing and product listing",
      "Product card shared across carousel and grid",
      "Persistent cart with a live item count",
      "Best sellers carousel",
      "Responsive storefront layout",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "CSS"],
    services: ["E-commerce builds"],
    duration: "Client project",
    accent: "from-amber-400/25 to-orange-600/10",
  },
  {
    slug: "bludgers-automotive",
    name: "Bludgers Automotive",
    client: "Bludgers Automotive",
    category: "Business site",
    year: 2023,
    image: "/work/04-cardealers.jpg",
    imageAlt:
      "Luxury car dealership website with a minimal white monogram, a Collection / Classics / Contact navigation, and a full-bleed photograph of a gold sports car.",
    summary:
      "A dealer showcase for performance and classic cars, where the photography does the selling and the interface stays out of its way.",
    challenge:
      "High-value vehicles sell on photography. Any interface that competes with the image — heavy chrome, boxed cards, loud type — makes the stock look cheaper than it is, and a dealership's entire proposition is that the stock is not cheap.",
    approach: [
      "Reduced the interface to three navigation items and a monogram, so nothing on screen competes with the vehicle",
      "Used full-bleed photography at viewport height, letting each car hold the frame on its own",
      "Split the catalogue into Collection and Classics, because those two audiences browse for completely different reasons",
      "Set type in a light weight over the image, with enough contrast to stay readable without a heavy scrim",
      "Kept the contact route one click from anywhere, since dealership enquiries are high value and low volume",
    ],
    scope: [
      "Full-bleed photographic showcase layout",
      "Collection and Classics catalogue sections",
      "Vehicle detail presentation",
      "Enquiry and contact route",
      "Responsive treatment that preserves the photography on mobile",
    ],
    stack: ["Next.js", "React", "Tailwind CSS", "Vercel"],
    services: ["Portfolios, blogs & marketing sites"],
    duration: "Client project",
    accent: "from-stone-400/20 to-amber-500/15",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const projectCategories = [
  "All",
  ...Array.from(new Set(projects.map((p) => p.category))),
] as const;
