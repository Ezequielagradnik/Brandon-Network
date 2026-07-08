import { createClient } from "@/lib/supabase/server";

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
