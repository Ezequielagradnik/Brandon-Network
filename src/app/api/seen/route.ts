import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 10;

// Marca actividad del usuario y acumula tiempo activo en la plataforma.
// El cliente late cada ~45s mientras la pestaña está visible; sumamos el
// tiempo real transcurrido desde el latido anterior (ignorando huecos > 90s,
// que son idle o pestaña cerrada). Así medimos "tiempo en la página".
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  await admin
    .from("profiles")
    .update({ last_seen_at: now.toISOString() })
    .eq("id", user.id);

  const { data: row } = await admin
    .from("usage_activity")
    .select("active_seconds, updated_at")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  let add = 0;
  if (row?.updated_at) {
    const delta = (now.getTime() - Date.parse(row.updated_at)) / 1000;
    if (delta > 0 && delta <= 90) add = Math.round(delta);
  }
  const active = (row?.active_seconds ?? 0) + add;

  await admin
    .from("usage_activity")
    .upsert(
      { user_id: user.id, day, active_seconds: active, updated_at: now.toISOString() },
      { onConflict: "user_id,day" },
    );

  return Response.json({ ok: true });
}
