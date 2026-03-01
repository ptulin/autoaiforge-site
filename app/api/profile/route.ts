import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAllTools, getUniqueTopics } from "@/lib/github";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const [{ data: subscriber }, toolsData] = await Promise.all([
    admin
      .from("subscribers")
      .select("id, email, confirmed, topics, subscribe_all, frequency, subscribed_tools, unsubscribe_token, created_at")
      .eq("email", user.email)
      .single(),
    getAllTools(),
  ]);

  const allTopics = getUniqueTopics(toolsData.tools);

  return NextResponse.json({ subscriber: subscriber ?? null, allTopics });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.frequency !== undefined) {
    const valid = ["daily", "weekly", "monthly"];
    if (!valid.includes(body.frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }
    updates.frequency = body.frequency;
  }

  if (body.subscribe_all !== undefined) {
    updates.subscribe_all = Boolean(body.subscribe_all);
  }

  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics)) {
      return NextResponse.json({ error: "topics must be an array" }, { status: 400 });
    }
    updates.topics = body.topics;
  }

  if (body.subscribed_tools !== undefined) {
    if (!Array.isArray(body.subscribed_tools)) {
      return NextResponse.json({ error: "subscribed_tools must be an array" }, { status: 400 });
    }
    updates.subscribed_tools = body.subscribed_tools;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("subscribers")
    .update(updates)
    .eq("email", user.email)
    .select("id, email, confirmed, topics, subscribe_all, frequency, subscribed_tools, unsubscribe_token, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscriber: data });
}
