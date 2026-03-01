import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message is too short." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim().substring(0, 100),
      email: email.trim().toLowerCase(),
      subject: (subject ?? "").trim().substring(0, 200),
      message: message.trim().substring(0, 5000),
    });

    if (error) {
      console.error("contact insert error:", error);
      return NextResponse.json({ error: "Failed to save message." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
