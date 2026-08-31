/**
 * Resolve hook that teaches Node the `@/*` path alias from tsconfig.json.
 *
 * The test scripts run source modules directly through Node's TypeScript
 * stripping, with no bundler in the loop — so `@/config/site` has to be mapped
 * to `src/config/site.ts` here. Extensionless specifiers get `.ts` appended,
 * then `/index.ts`, matching what Turbopack resolves at build time.
 *
 * Test-only. Nothing in the application depends on this.
 */

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function firstExisting(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const resolved = firstExisting(path.join(projectRoot, "src", specifier.slice(2)));
    if (resolved) {
      return next(pathToFileURL(resolved).href, context);
    }
  }
  return next(specifier, context);
}
