export type Author = {
  name: string;
  role: string;
  initials: string;
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category:
    | "Engineering"
    | "Architecture"
    | "Payments"
    | "Performance"
    | "Business"
    | "DevOps";
  tags: string[];
  author: Author;
  featured?: boolean;
  /** Article body in GitHub-flavoured Markdown. */
  body: string;
};

export const authors: Record<string, Author> = {
  lead: { name: "A. Meer", role: "Principal engineer", initials: "AM" },
  backend: { name: "Sofia Almeida", role: "Backend lead", initials: "SA" },
  frontend: { name: "Daniel Okoro", role: "Frontend lead", initials: "DO" },
  infra: { name: "Hana Kobayashi", role: "Platform engineer", initials: "HK" },
};
