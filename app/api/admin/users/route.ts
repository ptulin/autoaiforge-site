import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();

  // List all auth users (requires service role key)
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also get all subscriber emails to cross-reference
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email, confirmed, frequency, subscribe_all");

  const subscriberMap = new Map(
    (subscribers ?? []).map((s) => [s.email, s])
  );

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    confirmed_at: u.confirmed_at,
    subscriber: subscriberMap.get(u.email ?? "") ?? null,
  }));

  return NextResponse.json({ users });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, email } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Delete Supabase Auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Also delete their subscriber row if email provided
  if (email) {
    await supabase.from("subscribers").delete().eq("email", email);
  }

  return NextResponse.json({ success: true });
}
