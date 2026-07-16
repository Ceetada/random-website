import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** timing-safe comparison that won't throw on differing lengths */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Verify a username/password against the configured admin credentials. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "change-me-please";
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

/** Create a signed session cookie. Call after a successful login. */
export async function createSession(username: string): Promise<void> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}:${expires}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Return the logged-in username, or null if there is no valid session. */
export async function getSession(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!safeEqual(signature, sign(payload))) return null;

  const sep = payload.lastIndexOf(":");
  const username = payload.slice(0, sep);
  const expires = Number(payload.slice(sep + 1));
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return username;
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getSession()) !== null;
}
