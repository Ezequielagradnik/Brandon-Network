import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// MICs de Nasdaq (ISO 10383). XNYS/ARCX quedan afuera a propósito.
const NASDAQ_MICS = new Set(["XNAS", "XNGS", "XNMS", "XNCM"]);

type FinnhubSymbol = {
  symbol?: string;
  description?: string;
  displaySymbol?: string;
  mic?: string;
  type?: string;
  currency?: string;
};

async function authorize(req: Request): Promise<boolean> {
  // 1) Cron de Vercel: manda Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }
  // 2) Usuario admin autenticado (para correrlo a mano)
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
  if (!(await authorize(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ error: "sin_key" }, { status: 200 });

  // Lista completa de símbolos de EE.UU.
  const r = await fetch(
    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${key}`,
    { cache: "no-store" },
  );
  if (!r.ok) {
    return Response.json({ error: `finnhub ${r.status}` }, { status: 200 });
  }
  const all: FinnhubSymbol[] = await r.json();

  const rows = all
    .filter(
      (s) =>
        s.symbol &&
        s.description &&
        s.type === "Common Stock" &&
        s.mic &&
        NASDAQ_MICS.has(s.mic) &&
        !s.symbol.includes("."),
    )
    .map((s) => ({
      symbol: s.symbol as string,
      name: s.description as string,
      mic: s.mic ?? null,
      type: s.type ?? null,
      currency: s.currency ?? "USD",
      updated_at: new Date().toISOString(),
    }));

  const admin = createAdminClient();
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await admin
      .from("companies")
      .upsert(chunk, { onConflict: "symbol" });
    if (error) {
      return Response.json(
        { error: error.message, upserted },
        { status: 200 },
      );
    }
    upserted += chunk.length;
  }

  return Response.json({ ok: true, total: rows.length, upserted });
}
