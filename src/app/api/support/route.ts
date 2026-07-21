import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 20;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("support_messages")
    .select("id, sender, body, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ messages: [] });
  return Response.json({ messages: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: string;
  try {
    const json = await req.json();
    body = String(json.body ?? "").trim();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!body) return new Response("Mensaje vacío", { status: 400 });

  const { data, error } = await supabase
    .from("support_messages")
    .insert({ user_id: user.id, sender: "client", body })
    .select("id, sender, body, created_at")
    .single();

  if (error) return new Response(error.message, { status: 500 });

  // TODO (fase 2): reenviar a WhatsApp de Brandon vía Cloud API de Meta.

  return Response.json({ message: data });
}

// El cliente solo puede tocar sus propios mensajes (sender = 'client').
async function ownClientMessage(userId: string, id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_messages")
    .select("user_id, sender")
    .eq("id", id)
    .single();
  if (!data || data.user_id !== userId || data.sender !== "client") return null;
  return admin;
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let id: string;
  let body: string;
  try {
    const json = await req.json();
    id = String(json.id ?? "");
    body = String(json.body ?? "").trim();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!id || !body) return new Response("Faltan datos", { status: 400 });

  const admin = await ownClientMessage(user.id, id);
  if (!admin) return new Response("Forbidden", { status: 403 });

  const { data, error } = await admin
    .from("support_messages")
    .update({ body })
    .eq("id", id)
    .select("id, sender, body, created_at")
    .single();
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ message: data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let id: string;
  try {
    const json = await req.json();
    id = String(json.id ?? "");
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!id) return new Response("Falta id", { status: 400 });

  const admin = await ownClientMessage(user.id, id);
  if (!admin) return new Response("Forbidden", { status: 403 });

  const { error } = await admin.from("support_messages").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true, id });
}
