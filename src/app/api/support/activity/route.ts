import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 20;

async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const days = Math.min(
    60,
    Math.max(7, parseInt(url.searchParams.get("days") ?? "14", 10) || 14),
  );

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const admin = createAdminClient();
  let query = admin
    .from("support_messages")
    .select("created_at")
    .gte("created_at", since.toISOString());
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;

  const buckets: { dayStart: number; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    buckets.push({ dayStart: since.getTime() + i * 86400000, count: 0 });
  }
  for (const m of data ?? []) {
    const idx = Math.floor((Date.parse(m.created_at) - since.getTime()) / 86400000);
    if (idx >= 0 && idx < days) buckets[idx].count++;
  }

  return Response.json({ buckets });
}
