import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAssistantData, type Msg } from "@/lib/adminAssistant";

export const maxDuration = 20;

export async function GET(req: Request) {
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

  const userId = new URL(req.url).searchParams.get("userId") || undefined;

  const admin = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 86400000);
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const today0Ymd = today0.toISOString().slice(0, 10);

  const [{ data: profiles }, { data: conversations }, { data: aiMsgs }, { data: activity }] =
    await Promise.all([
      admin.from("profiles").select("id, full_name, email"),
      admin.from("conversations").select("id, user_id"),
      admin
        .from("messages")
        .select("id, conversation_id, role, content, created_at")
        .gte("created_at", since30.toISOString())
        .order("created_at", { ascending: true }),
      admin.from("usage_activity").select("user_id, active_seconds").eq("day", today0Ymd),
    ]);

  const names = new Map<string, { name: string; email: string }>();
  for (const p of profiles ?? []) {
    names.set(p.id, {
      name: p.full_name || p.email?.split("@")[0] || "Usuario",
      email: p.email || "",
    });
  }

  const data = buildAssistantData({
    conversations: conversations ?? [],
    messages: (aiMsgs ?? []) as Msg[],
    activity: activity ?? [],
    names,
    filterUserId: userId,
  });

  return Response.json(data);
}
