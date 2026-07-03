import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 30);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({
    conversations: data ?? [],
    hasMore: (data?.length ?? 0) === limit,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "Nuevo chat").trim().slice(0, 80) || "Nuevo chat";

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ id: data.id });
}
