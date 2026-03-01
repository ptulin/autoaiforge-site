import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return new NextResponse(page("⚠️", "Invalid link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscribers")
    .delete()
    .eq("email", email)
    .eq("unsubscribe_token", token);

  if (error) {
    return new NextResponse(page("⚠️", "Error", "Something went wrong. Please try again."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(
    page("👋", "Unsubscribed", "You've been removed from the mailing list. Sorry to see you go!"),
    { headers: { "Content-Type": "text/html" } }
  );
}

function page(emoji: string, title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#050914;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="text-align:center;background:#0d1424;border:1px solid #1e2d4a;border-radius:12px;padding:48px 40px;max-width:420px">
    <div style="font-size:56px;margin-bottom:16px">${emoji}</div>
    <h1 style="color:#fff;margin-bottom:8px">${title}</h1>
    <p style="color:#94a3b8;margin-bottom:28px">${body}</p>
    <a href="https://aitools.disruptiveexperience.com" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
      Browse Tools →
    </a>
  </div></body></html>`;
}
