#!/usr/bin/env node
/**
 * Renders one of each HR document from sample data, so the templates can be
 * looked at without a database, a login, or a real employee's salary.
 *
 *   npm run docs:preview            # writes to .preview/
 *   npm run docs:preview -- /tmp/x  # or somewhere else
 *
 * A thin loader: jiti compiles the .tsx (Node's own type stripping does not
 * handle JSX) and the actual work happens in document-samples.tsx, so the
 * templates, React and @react-pdf/renderer all resolve through one loader.
 *
 * Dev-only; nothing in the app imports this.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { createJiti } from "jiti";
import React from "react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] ?? path.join(root, ".preview"));

const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(root, "src") },
  interopDefault: true,
  // Without this, .tsx is parsed as plain TypeScript and `<Document` reads as a
  // generic: "Unexpected token, expected ','". The automatic runtime matches
  // tsconfig's "jsx": "react-jsx" — the classic one would need every template
  // to import React purely to satisfy this dev script.
  jsx: true,
});

// jiti compiles JSX with the classic runtime, so `React` has to be in scope for
// every module it loads. Exposing one instance globally does that without
// adding an `import React` to five application files purely for this script —
// and guarantees a single React, which react-pdf requires: elements built by
// one copy and rendered by another leave it reading `props` off null.
globalThis.React = React;

const { renderAll } = await jiti.import(path.join(root, "scripts/document-samples.tsx"));

const written = await renderAll(outDir);
for (const file of written) console.log(`  ${file}`);
console.log(`\n${written.length} sample documents written.`);
