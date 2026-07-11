import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeUsername(raw: string) {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracked_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const username = normalizeUsername(String(body.username ?? ""));

  if (!username) {
    return NextResponse.json({ error: "username fehlt" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracked_accounts")
    .insert({ username, notes: body.notes ?? null })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("tracked_accounts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
