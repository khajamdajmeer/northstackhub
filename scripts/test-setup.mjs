/**
 * Registers the `@/*` alias hook before a test module is loaded.
 * Used via `node --import ./scripts/test-setup.mjs`.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hook.mjs", pathToFileURL(import.meta.filename));
