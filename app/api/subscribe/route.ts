import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, topics, subscribeAll } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, confirmed, confirmation_token")
      .eq("email", email)
      .single();

    const confirmToken = randomBytes(32).toString("hex");
    const unsubToken = randomBytes(32).toString("hex");

    if (existing) {
      // Update preferences and resend confirmation if not confirmed
      await supabase
        .from("subscribers")
        .update({
          topics: subscribeAll ? [] : topics,
          subscribe_all: subscribeAll ?? true,
          confirmation_token: existing.confirmed ? existing.confirmation_token : confirmToken,
          unsubscribe_token: unsubToken,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (existing.confirmed) {
        return NextResponse.json({ message: "Preferences updated!" });
      }
    } else {
      // Insert new subscriber
      const { error } = await supabase.from("subscribers").insert({
        email,
        topics: subscribeAll ? [] : topics,
        subscribe_all: subscribeAll ?? true,
        confirmed: false,
        confirmation_token: confirmToken,
        unsubscribe_token: unsubToken,
      });

      if (error) throw error;
    }

    // Send confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aitools.disruptiveexperience.com";
    const confirmUrl = `${siteUrl}/api/confirm?token=${confirmToken}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: "AutoAIForge <noreply@disruptiveexperience.com>",
      to: email,
      subject: "Confirm your AutoAIForge subscription",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #050914; color: #e2e8f0; padding: 40px 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: #0d1424; border: 1px solid #1e2d4a; border-radius: 12px; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px;">🤖</span>
              <h1 style="color: #fff; margin: 8px 0 4px;">AutoAIForge</h1>
              <p style="color: #60a5fa; margin: 0; font-size: 14px;">Daily AI Tools Newsletter</p>
            </div>
            <h2 style="color: #fff; font-size: 20px; margin-bottom: 12px;">Confirm your subscription</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">
              Click the button below to confirm your email and start receiving daily AI tool digests.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${confirmUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Confirm Subscription ✓
              </a>
            </div>
            <p style="color: #475569; font-size: 12px; text-align: center; margin: 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ message: "Check your email to confirm!" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
