import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const INDICES = [
  { s: "^GSPC", label: "S&P 500" },
  { s: "^IXIC", label: "Nasdaq" },
  { s: "^DJI", label: "Dow Jones" },
  { s: "GC=F", label: "Oro" },
  { s: "BTC-USD", label: "Bitcoin" },
  { s: "ARS=X", label: "Dólar" },
];

const STOCKS = [
  { s: "AAPL", label: "Apple" },
  { s: "MSFT", label: "Microsoft" },
  { s: "NVDA", label: "NVIDIA" },
  { s: "AMZN", label: "Amazon" },
  { s: "GOOGL", label: "Alphabet" },
  { s: "META", label: "Meta" },
  { s: "TSLA", label: "Tesla" },
  { s: "JPM", label: "JPMorgan" },
];

type Quote = { label: string; symbol: string; price: number; changePct: number };

async function quote(sym: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`,
      { headers: { "User-Agent": UA }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const m = j?.chart?.result?.[0]?.meta;
    if (!m || typeof m.regularMarketPrice !== "number") return null;
    const prev = m.chartPreviousClose ?? m.previousClose;
    const changePct = prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0;
    return { label: sym, symbol: sym, price: m.regularMarketPrice, changePct };
  } catch {
    return null;
  }
}

// Secuencial: evita que Yahoo bloquee una ráfaga de requests en paralelo.
async function quotesFor(list: { s: string; label: string }[]) {
  const out: Quote[] = [];
  for (const it of list) {
    const q = await quote(it.s);
    if (q) out.push({ ...q, label: it.label });
  }
  return out;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const newsRes = await fetch(
    "https://query1.finance.yahoo.com/v1/finance/search?q=stock%20market&newsCount=12&quotesCount=0",
    { headers: { "User-Agent": UA }, cache: "no-store" },
  );
  const indices = await quotesFor(INDICES);
  const stocks = await quotesFor(STOCKS);

  let news: {
    title: string;
    publisher: string;
    link: string;
    time: number;
  }[] = [];
  if (newsRes.ok) {
    const nj = await newsRes.json();
    news = (nj?.news ?? [])
      .filter((n: any) => n.title && n.link)
      .map((n: any) => ({
        title: n.title,
        publisher: n.publisher ?? "",
        link: n.link,
        time: n.providerPublishTime ?? 0,
      }));
  }

  return Response.json(
    { indices, stocks, news },
    { headers: { "Cache-Control": "s-maxage=180, stale-while-revalidate=600" } },
  );
}
