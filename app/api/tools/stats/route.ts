import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface ToolStatEntry {
  download_count: number;
  rating_avg: number;
  rating_count: number;
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tool_stats")
    .select("tool_name, tool_date, download_count, rating_sum, rating_count");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build a map keyed by "tool_name|tool_date" for O(1) lookup on the client
  const stats: Record<string, ToolStatEntry> = {};
  for (const row of data ?? []) {
    const key = `${row.tool_name}|${row.tool_date}`;
    stats[key] = {
      download_count: row.download_count ?? 0,
      rating_avg:
        row.rating_count > 0 ? row.rating_sum / row.rating_count : 0,
      rating_count: row.rating_count ?? 0,
    };
  }

  return NextResponse.json({ stats });
}
