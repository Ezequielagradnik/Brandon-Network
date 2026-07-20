import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 20;

// Verifica que el usuario logueado sea admin.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin" ? user : null;
}

// GET (sin userId): lista de conversaciones. GET (?userId=): hilo de ese cliente.
export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const userId = new URL(req.url).searchParams.get("userId");

  if (userId) {
    const { data, error } = await admin
      .from("support_messages")
      .select("id, sender, body, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) return Response.json({ messages: [] });
    return Response.json({ messages: data ?? [] });
  }

  // Lista de conversaciones: último mensaje por cliente
  const { data: msgs } = await admin
    .from("support_messages")
    .select("user_id, sender, body, created_at")
    .order("created_at", { ascending: false });

  type Agg = {
    userId: string;
    lastBody: string;
    lastAt: string;
    lastSender: string;
    pending: number; // mensajes del cliente sin responder (los más recientes)
    counting: boolean; // seguimos contando pendientes desde el más nuevo
  };
  const seen = new Map<string, Agg>();
  // msgs viene ordenado del más nuevo al más viejo
  for (const m of msgs ?? []) {
    let c = seen.get(m.user_id);
    if (!c) {
      c = {
        userId: m.user_id,
        lastBody: m.body,
        lastAt: m.created_at,
        lastSender: m.sender,
        pending: 0,
        counting: true,
      };
      seen.set(m.user_id, c);
    }
    if (c.counting) {
      if (m.sender === "client") c.pending++;
      else c.counting = false; // llegamos a una respuesta de Brandon: cortamos
    }
  }

  const ids = [...seen.keys()];
  const profileMap = new Map<string, { name: string; email: string }>();
  if (ids.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        name: p.full_name || (p.email ?? "").split("@")[0] || "Cliente",
        email: p.email ?? "",
      });
    }
  }

  const conversations = [...seen.values()].map((c) => ({
    userId: c.userId,
    lastBody: c.lastBody,
    lastAt: c.lastAt,
    lastSender: c.lastSender,
    pending: c.pending,
    name: profileMap.get(c.userId)?.name ?? "Cliente",
    email: profileMap.get(c.userId)?.email ?? "",
  }));

  return Response.json({ conversations });
}

// POST: responder como Brandon a un cliente.
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  let userId: string;
  let body: string;
  try {
    const json = await req.json();
    userId = String(json.userId ?? "");
    body = String(json.body ?? "").trim();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!userId || !body) return new Response("Faltan datos", { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_messages")
    .insert({ user_id: userId, sender: "brandon", body })
    .select("id, sender, body, created_at")
    .single();

  if (error) return new Response(error.message, { status: 500 });

  // TODO (opcional, fase 2): reenviar esta respuesta al WhatsApp del cliente vía Meta.

  return Response.json({ message: data });
}
