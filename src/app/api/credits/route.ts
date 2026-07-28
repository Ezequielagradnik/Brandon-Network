import { createClient } from "@/lib/supabase/server";

export const maxDuration = 10;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("credits, full_name, role")
    .eq("id", user.id)
    .single();

  const fullName = data?.full_name || user.email?.split("@")[0] || "";
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";

  return Response.json({
    credits: data?.credits ?? 0,
    cost: 50,
    total: 500,
    name: firstName,
    unlimited: data?.role === "admin",
  });
}
