import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 15;

// Solo este usuario puede eliminar feedback (ni siquiera otros admins).
const OWNER_EMAIL = "eagradnik@gmail.com";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [{ data: items }, { data: votes }, { data: prof }] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, title, description, created_at, user_id, status")
      .order("created_at", { ascending: false }),
    supabase.from("feedback_votes").select("feedback_id, user_id"),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  const isAdmin = prof?.role === "admin";

  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const v of votes ?? []) {
    counts.set(v.feedback_id, (counts.get(v.feedback_id) ?? 0) + 1);
    if (v.user_id === user.id) mine.add(v.feedback_id);
  }

  // Autor: solo se resuelve y se expone a admins
  const authorMap = new Map<string, string>();
  if (isAdmin && items?.length) {
    const ids = [...new Set(items.map((i) => i.user_id))];
    const admin = createAdminClient();
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    for (const p of profs ?? []) {
      authorMap.set(p.id, p.full_name || p.email || "—");
    }
  }

  const list = (items ?? [])
    .map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      createdAt: it.created_at,
      status: it.status || "nueva",
      votes: counts.get(it.id) ?? 0,
      voted: mine.has(it.id),
      ...(isAdmin ? { author: authorMap.get(it.user_id) ?? "—" } : {}),
    }))
    .sort((a, b) => b.votes - a.votes);

  const canDelete = (user.email ?? "").toLowerCase() === OWNER_EMAIL;
  return Response.json({ items: list, canDelete, isAdmin });
}

const STATUSES = ["nueva", "revision", "planeada", "progreso", "hecha"];

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (prof?.role !== "admin") return new Response("Forbidden", { status: 403 });

  let id: string;
  let status: string;
  try {
    const body = await req.json();
    id = String(body.id ?? "");
    status = String(body.status ?? "");
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!id || !STATUSES.includes(status)) {
    return new Response("Datos inválidos", { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("feedback")
    .update({ status })
    .eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
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

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if ((user.email ?? "").toLowerCase() !== OWNER_EMAIL) {
    return new Response("Forbidden", { status: 403 });
  }

  let id: string;
  try {
    const body = await req.json();
    id = String(body.id ?? "");
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!id) return new Response("Falta id", { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("feedback").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}
