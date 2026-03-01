import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function isAuthorized(req: NextRequest): boolean {
  const token =
    req.headers.get("x-admin-secret") ||
    req.nextUrl.searchParams.get("secret");
  return token === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, read } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contact_messages")
    .update({ read: read ?? true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
