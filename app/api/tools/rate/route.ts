import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { tool_name, tool_date, rating } = body ?? {};

  if (!tool_name || !tool_date || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Dedup by hashed (IP + User-Agent) — anonymous but unique per device/network
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  const voter_hash = createHash("sha256")
    .update(`${ip}:${ua}`)
    .digest("hex");

  const supabase = getSupabaseAdmin();

  // Upsert the vote (updates rating if same voter rates again)
  const { error: ratingError } = await supabase.from("tool_ratings").upsert(
    { tool_name, tool_date, rating, voter_hash },
    { onConflict: "tool_name,tool_date,voter_hash" }
  );

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 });
  }

  // Recalculate aggregate from source of truth
  const { data: agg, error: aggError } = await supabase
    .from("tool_ratings")
    .select("rating")
    .eq("tool_name", tool_name)
    .eq("tool_date", tool_date);

  if (aggError) {
    return NextResponse.json({ error: aggError.message }, { status: 500 });
  }

  const rating_count = agg?.length ?? 0;
  const rating_sum = agg?.reduce((s, r) => s + r.rating, 0) ?? 0;

  // Update tool_stats — use RPC to preserve download_count
  const { error: statsError } = await supabase.rpc("upsert_rating_stats", {
    p_tool_name: tool_name,
    p_tool_date: tool_date,
    p_rating_sum: rating_sum,
    p_rating_count: rating_count,
  });

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    rating_avg: rating_count > 0 ? rating_sum / rating_count : 0,
    rating_count,
  });
}
