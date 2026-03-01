import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toolSlug } = await req.json();
  if (!toolSlug || typeof toolSlug !== "string") {
    return NextResponse.json({ error: "toolSlug required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Get current subscriber row
  const { data: sub, error: fetchErr } = await admin
    .from("subscribers")
    .select("subscribed_tools")
    .eq("email", user.email)
    .single();

  if (fetchErr || !sub) {
    return NextResponse.json({ error: "Subscriber not found. Please subscribe first." }, { status: 404 });
  }

  const currentTools: string[] = sub.subscribed_tools ?? [];
  const alreadyWatching = currentTools.includes(toolSlug);

  if (alreadyWatching) {
    return NextResponse.json({ watching: true, alreadyWatching: true });
  }

  const { error: updateErr } = await admin
    .from("subscribers")
    .update({ subscribed_tools: [...currentTools, toolSlug] })
    .eq("email", user.email);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ watching: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toolSlug } = await req.json();
  const admin = getSupabaseAdmin();

  const { data: sub } = await admin
    .from("subscribers")
    .select("subscribed_tools")
    .eq("email", user.email)
    .single();

  const updated = (sub?.subscribed_tools ?? []).filter((s: string) => s !== toolSlug);

  await admin
    .from("subscribers")
    .update({ subscribed_tools: updated })
    .eq("email", user.email);

  return NextResponse.json({ watching: false });
}
