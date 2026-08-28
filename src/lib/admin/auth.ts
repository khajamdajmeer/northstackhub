import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * Credential and session primitives for the /aka console.
 *
 * There is exactly one operator, so there is no user table: the password lives
 * as a scrypt hash in ADMIN_PASSWORD_HASH and the session is a signed cookie
 * rather than a database row. That keeps sign-in a pure function of the
 * environment — no round trip, and nothing to leak if the database is exposed.
 *
 * Built on node:crypto rather than a bcrypt/argon2 dependency: scrypt is memory
 * hard, ships in the runtime, and needs no native build step on Vercel.
 */

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export const SESSION_COOKIE = "aka_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // Eight hours — one working day.

/** Produces the value that belongs in ADMIN_PASSWORD_HASH. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${HASH_PREFIX}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [prefix, saltHex, hashHex] = stored.split(":");
  if (prefix !== HASH_PREFIX || !saltHex || !hashHex) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------
// `<base64url(payload)>.<base64url(hmac)>`. Stateless and self-expiring, so
// signing out is just clearing the cookie. Rotating ADMIN_SESSION_SECRET
// invalidates every outstanding session at once.

export type AdminSession = {
  email: string;
  /** Unix seconds. */
  issuedAt: number;
  expiresAt: number;
};

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payload: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(payload).digest());
}

export function createSessionToken(email: string, secret: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const session: AdminSession = {
    email,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS,
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns null for anything malformed, mis-signed or expired. */
export function readSessionToken(
  token: string | undefined,
  secret: string,
): AdminSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  // Compared over fixed-length digests so the check cannot leak the signature
  // one byte at a time.
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let session: AdminSession;
  try {
    session = JSON.parse(base64UrlDecode(payload).toString("utf8")) as AdminSession;
  } catch {
    return null;
  }

  if (
    typeof session.email !== "string" ||
    typeof session.expiresAt !== "number" ||
    session.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return session;
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export type AdminCredentials = {
  email: string;
  passwordHash: string;
  sessionSecret: string;
};

/**
 * Null when the console has not been configured. Callers treat that as "no one
 * can sign in" rather than throwing, so a deployment missing these vars shows a
 * setup notice instead of a 500 — and never falls open.
 */
export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !passwordHash || !sessionSecret) return null;
  return { email, passwordHash, sessionSecret };
}
