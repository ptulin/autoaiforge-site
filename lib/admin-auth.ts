import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionMaxAge() {
  return ADMIN_SESSION_TTL_SECONDS;
}

export function createAdminSessionToken(secret: string): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS };
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function verifyAdminSessionToken(token: string, secret: string): boolean {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;
  const expected = sign(payloadB64, secret);
  if (!safeCompare(signature, expected)) return false;

  try {
    const payloadRaw = decodeBase64Url(payloadB64);
    const payload = JSON.parse(payloadRaw) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== "number") return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAdminAuthorized(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  const headerSecret = req.headers.get("x-admin-secret");
  if (headerSecret && safeCompare(headerSecret, adminSecret)) {
    return true;
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token, adminSecret);
}
