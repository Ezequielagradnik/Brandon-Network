import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const INDICES = [
  { s: "^GSPC", label: "S&P 500" },
  { s: "^IXIC", label: "Nasdaq" },
  { s: "^DJI", label: "Dow Jones" },
  { s: "GC=F", label: "Oro" },
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

async function quotesFor(list: { s: string; label: string }[]) {
  const out = await Promise.all(
    list.map(async (it) => {
      const q = await quote(it.s);
      return q ? { ...q, label: it.label } : null;
    }),
  );
  return out.filter(Boolean);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [indices, stocks, newsRes] = await Promise.all([
    quotesFor(INDICES),
    quotesFor(STOCKS),
    fetch(
      "https://query1.finance.yahoo.com/v1/finance/search?q=stock%20market&newsCount=12&quotesCount=0",
      { headers: { "User-Agent": UA }, cache: "no-store" },
    ),
  ]);

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
