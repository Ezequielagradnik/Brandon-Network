import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const msgs = body?.messages;
  if (!Array.isArray(msgs)) return new Response("messages requerido", { status: 400 });

  const rows = msgs
    .filter(
      (m) => (m?.role === "user" || m?.role === "assistant") && m?.content,
    )
    .map((m) => ({ conversation_id: id, role: m.role, content: m.content }));

  if (rows.length) {
    const { error } = await supabase.from("messages").insert(rows);
    if (error) return new Response(error.message, { status: 500 });
  }
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return Response.json({ ok: true });
}
