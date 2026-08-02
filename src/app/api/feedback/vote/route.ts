import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

// Toggle de voto (like): si ya votó lo saca, si no votó lo agrega.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let feedbackId: string;
  try {
    const body = await req.json();
    feedbackId = String(body.feedbackId ?? "");
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!feedbackId) return new Response("Falta feedbackId", { status: 400 });

  const { data: existing } = await supabase
    .from("feedback_votes")
    .select("feedback_id")
    .eq("feedback_id", feedbackId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("feedback_votes")
      .delete()
      .eq("feedback_id", feedbackId)
      .eq("user_id", user.id);
    return Response.json({ voted: false });
  }

  const { error } = await supabase
    .from("feedback_votes")
    .insert({ feedback_id: feedbackId, user_id: user.id });
  if (error) return new Response(process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor", { status: 500 });
  return Response.json({ voted: true });
}
