import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionMaxAge,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const secret = body?.secret;
  if (typeof secret !== "string" || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = createAdminSessionToken(adminSecret);
  const res = NextResponse.json({ success: true });
  res.cookies.set(getAdminSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAdminSessionMaxAge(),
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
