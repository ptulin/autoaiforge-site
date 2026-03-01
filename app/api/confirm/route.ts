import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return new NextResponse(errorPage("Invalid confirmation link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscribers")
    .update({ confirmed: true, confirmation_token: null, updated_at: new Date().toISOString() })
    .eq("email", email)
    .eq("confirmation_token", token)
    .select()
    .single();

  if (error || !data) {
    return new NextResponse(errorPage("Invalid or expired link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(successPage(), {
    headers: { "Content-Type": "text/html" },
  });
}

function successPage() {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#050914;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="text-align:center;background:#0d1424;border:1px solid #1e2d4a;border-radius:12px;padding:48px 40px;max-width:420px">
    <div style="font-size:56px;margin-bottom:16px">🎉</div>
    <h1 style="color:#fff;margin-bottom:8px">You're confirmed!</h1>
    <p style="color:#94a3b8;margin-bottom:28px">You'll receive your first AI tools digest tonight. Fresh tools, every morning.</p>
    <a href="https://aitools.disruptiveexperience.com" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
      Browse Tools →
    </a>
  </div></body></html>`;
}

function errorPage(msg: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#050914;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="text-align:center;background:#0d1424;border:1px solid #1e2d4a;border-radius:12px;padding:48px 40px;max-width:420px">
    <div style="font-size:56px;margin-bottom:16px">⚠️</div>
    <h1 style="color:#fff;margin-bottom:8px">Confirmation failed</h1>
    <p style="color:#94a3b8;margin-bottom:28px">${msg}</p>
    <a href="https://aitools.disruptiveexperience.com" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
      Try Again →
    </a>
  </div></body></html>`;
}
