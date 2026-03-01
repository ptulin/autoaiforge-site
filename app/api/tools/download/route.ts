import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { tool_name, tool_date } = body ?? {};

  if (!tool_name || !tool_date) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Atomically increment download_count via Postgres function
  const { error } = await supabase.rpc("increment_download", {
    p_tool_name: tool_name,
    p_tool_date: tool_date,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
