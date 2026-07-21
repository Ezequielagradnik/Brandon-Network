import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type Match = { symbol: string; description: string; type: string };
type News = {
  title: string;
  publisher: string;
  link: string;
  time: number;
  summary: string;
};
type Profile = {
  name: string;
  ticker: string;
  exchange: string;
  logo: string;
  industry: string;
  currency: string;
  weburl: string;
};
type Quote = { price: number; changePct: number | null };

const BASE = "https://finnhub.io/api/v1";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function search(q: string, key: string): Promise<Match[]> {
  const r = await fetch(
    `${BASE}/search?q=${encodeURIComponent(q)}&token=${key}`,
    { cache: "no-store" },
  );
  if (!r.ok) return [];
  const j = await r.json();
  const rows: Match[] = (j?.result ?? [])
    .map((x: { symbol?: string; description?: string; type?: string }) => ({
      symbol: x.symbol ?? "",
      description: x.description ?? "",
      type: x.type ?? "",
    }))
    // Solo acciones comunes, sin símbolos con puntos raros (ADR/menores ruido)
    .filter(
      (x: Match) =>
        x.symbol &&
        x.description &&
        (x.type === "" || x.type === "Common Stock") &&
        !x.symbol.includes("."),
    )
    .slice(0, 8);
  return rows;
}

async function detail(symbol: string, key: string) {
  const to = new Date();
  const from = new Date(to.getTime() - 21 * 86400000);

  const [profileRes, quoteRes, newsRes] = await Promise.all([
    fetch(`${BASE}/stock/profile2?symbol=${symbol}&token=${key}`, {
      cache: "no-store",
    }),
    fetch(`${BASE}/quote?symbol=${symbol}&token=${key}`, { cache: "no-store" }),
    fetch(
      `${BASE}/company-news?symbol=${symbol}&from=${ymd(from)}&to=${ymd(to)}&token=${key}`,
      { cache: "no-store" },
    ),
  ]);

  let profile: Profile | null = null;
  if (profileRes.ok) {
    const p = await profileRes.json();
    if (p?.name) {
      profile = {
        name: p.name,
        ticker: p.ticker ?? symbol,
        exchange: p.exchange ?? "",
        logo: p.logo ?? "",
        industry: p.finnhubIndustry ?? "",
        currency: p.currency ?? "USD",
        weburl: p.weburl ?? "",
      };
    }
  }

  let quote: Quote | null = null;
  if (quoteRes.ok) {
    const q = await quoteRes.json();
    if (typeof q?.c === "number" && q.c !== 0) {
      quote = { price: q.c, changePct: q.dp ?? null };
    }
  }

  let news: News[] = [];
  if (newsRes.ok) {
    const arr = await newsRes.json();
    if (Array.isArray(arr)) {
      news = arr
        .map(
          (n: {
            headline?: string;
            source?: string;
            url?: string;
            datetime?: number;
            summary?: string;
          }) => ({
            title: n.headline ?? "",
            publisher: n.source ?? "",
            link: n.url ?? "",
            time: n.datetime ?? 0,
            summary: n.summary ?? "",
          }),
        )
        .filter((n: News) => n.title && n.link && n.time > 0)
        .sort((a: News, b: News) => b.time - a.time)
        .slice(0, 20);
    }
  }

  return { profile, quote, news };
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ error: "sin_key" }, { status: 200 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const symbol = url.searchParams.get("symbol");

  try {
    if (symbol) {
      const data = await detail(symbol.toUpperCase(), key);
      return Response.json(data, {
        headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=600" },
      });
    }
    if (q && q.trim().length >= 1) {
      const matches = await search(q.trim(), key);
      return Response.json({ matches });
    }
    return Response.json({ matches: [] });
  } catch (e) {
    console.error("ticker error", e);
    return Response.json({ error: "fallo" }, { status: 200 });
  }
}
