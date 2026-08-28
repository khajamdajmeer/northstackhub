/**
 * Tests for the /aka credential and session primitives.
 *
 *   npm run test:auth
 *
 * No test runner: these are plain assertions over `src/lib/admin/auth.ts`, run
 * by Node's own TypeScript stripping. The `--conditions=react-server` flag in
 * the npm script is what lets the `server-only` import resolve outside Next.
 *
 * Deliberately contains no real credential. The deployed password lives only in
 * ADMIN_PASSWORD_HASH, and its plaintext is not written down anywhere.
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
  createSessionToken,
  hashPassword,
  readSessionToken,
  verifyPassword,
} from "../src/lib/admin/auth.ts";

const SECRET = "secret-used-only-by-this-test";
const OTHER_SECRET = "a-different-secret";

let passed = 0;
const ok = (label: string) => {
  console.log(`  ok - ${label}`);
  passed += 1;
};

// --- password hashing ------------------------------------------------------

const hash = await hashPassword("correct horse battery staple");

assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
ok("hash has the documented scrypt:salt:key shape");

assert.equal(await verifyPassword("correct horse battery staple", hash), true);
ok("correct password verifies");

assert.equal(await verifyPassword("wrong password", hash), false);
ok("wrong password is rejected");

// Two hashes of the same password must differ, or the salt is not doing its job.
assert.notEqual(hash, await hashPassword("correct horse battery staple"));
ok("hashing the same password twice gives different output (salted)");

assert.equal(await verifyPassword("x", "not-a-hash"), false);
ok("malformed stored hash is rejected rather than throwing");

assert.equal(await verifyPassword("x", "scrypt:abcd:beef"), false);
ok("stored hash with a short key is rejected");

assert.equal(await verifyPassword("x", "bcrypt:aa:bb"), false);
ok("stored hash with an unknown algorithm prefix is rejected");

// --- session tokens --------------------------------------------------------

const token = createSessionToken("someone@example.com", SECRET);

assert.equal(readSessionToken(token, SECRET)?.email, "someone@example.com");
ok("a valid token round-trips");

assert.equal(readSessionToken(token, OTHER_SECRET), null);
ok("a token signed with another secret is rejected (rotation works)");

const [payload, signature] = token.split(".");

assert.equal(readSessionToken(`${payload}xx.${signature}`, SECRET), null);
ok("a tampered payload is rejected");

assert.equal(readSessionToken(`${payload}.${signature.slice(0, -2)}ab`, SECRET), null);
ok("a tampered signature is rejected");

assert.equal(readSessionToken(undefined, SECRET), null);
ok("a missing token is rejected");

assert.equal(readSessionToken("garbage", SECRET), null);
ok("an unparseable token is rejected");

assert.equal(readSessionToken("a.b.c", SECRET), null);
ok("a wrong-shape token is rejected");

// An intact signature must not rescue an expired session.
const expiredPayload = Buffer.from(
  JSON.stringify({ email: "someone@example.com", issuedAt: 1, expiresAt: 2 }),
).toString("base64url");
const expiredSignature = createHmac("sha256", SECRET)
  .update(expiredPayload)
  .digest("base64url");

assert.equal(readSessionToken(`${expiredPayload}.${expiredSignature}`, SECRET), null);
ok("a correctly signed but expired token is rejected");

console.log(`\n${passed}/${passed} assertions passed`);
