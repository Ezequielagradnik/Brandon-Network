import { createClient } from "@/lib/supabase/server";

export const maxDuration = 20;

const PAGE = 50;

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  let query = supabase
    .from("companies")
    .select("symbol,name,mic", { count: "exact" })
    .order("symbol", { ascending: true })
    .range(offset, offset + PAGE - 1);

  if (q) {
    const safe = q.replace(/[%,]/g, "");
    query = query.or(`symbol.ilike.%${safe}%,name.ilike.%${safe}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    return Response.json({ companies: [], total: 0, hasMore: false });
  }

  const total = count ?? 0;
  return Response.json({
    companies: data ?? [],
    total,
    hasMore: offset + PAGE < total,
  });
}
