#!/usr/bin/env node
/**
 * Generates the values the /aka console needs in its environment.
 *
 *   npm run admin:hash -- 'your password here'
 *
 * Prints an ADMIN_PASSWORD_HASH line and a fresh ADMIN_SESSION_SECRET. The
 * plaintext password is never written anywhere — pass it in quotes, and clear
 * it from your shell history afterwards.
 */

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run admin:hash -- '<password>'");
  process.exit(1);
}

if (password.length < 12) {
  console.error("Use at least 12 characters — this is the only credential guarding the console.");
  process.exit(1);
}

const salt = randomBytes(16);
const key = await derive(password, salt, 64);

console.log();
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${key.toString("hex")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("hex")}`);
console.log();
console.log("Add both to .env.local, and to the project's environment variables on Vercel.");
console.log("Changing ADMIN_SESSION_SECRET signs everyone out immediately.");
