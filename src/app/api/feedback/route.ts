import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [{ data: items }, { data: votes }] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, title, description, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("feedback_votes").select("feedback_id, user_id"),
  ]);

  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const v of votes ?? []) {
    counts.set(v.feedback_id, (counts.get(v.feedback_id) ?? 0) + 1);
    if (v.user_id === user.id) mine.add(v.feedback_id);
  }

  const list = (items ?? [])
    .map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      votes: counts.get(it.id) ?? 0,
      voted: mine.has(it.id),
    }))
    .sort((a, b) => b.votes - a.votes);

  return Response.json({ items: list });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let title: string;
  let description: string;
  try {
    const body = await req.json();
    title = String(body.title ?? "").trim();
    description = String(body.description ?? "").trim();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!title) return new Response("Falta el título", { status: 400 });

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      title: title.slice(0, 120),
      description: description.slice(0, 1000) || null,
    })
    .select("id")
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ id: data.id });
}
