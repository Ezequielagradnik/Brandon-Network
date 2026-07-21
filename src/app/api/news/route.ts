import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type Quote = { label: string; price: number; changePct: number | null };
type News = {
  title: string;
  publisher: string;
  link: string;
  time: number;
  image?: string;
  summary?: string;
};

const FINNHUB_INDICES = [
  { s: "SPY", label: "S&P 500" },
  { s: "QQQ", label: "Nasdaq" },
  { s: "DIA", label: "Dow Jones" },
  { s: "GLD", label: "Oro" },
];
const FINNHUB_STOCKS = [
  { s: "AAPL", label: "Apple" },
  { s: "MSFT", label: "Microsoft" },
  { s: "NVDA", label: "NVIDIA" },
  { s: "AMZN", label: "Amazon" },
  { s: "GOOGL", label: "Alphabet" },
  { s: "META", label: "Meta" },
  { s: "TSLA", label: "Tesla" },
  { s: "JPM", label: "JPMorgan" },
];

// --- Fuentes keyless (funcionan desde el server) ---

async function cryptoBTC(): Promise<Quote | null> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const b = j?.bitcoin;
    if (!b) return null;
    return { label: "Bitcoin", price: b.usd, changePct: b.usd_24h_change ?? null };
  } catch {
    return null;
  }
}

async function googleNews(): Promise<News[]> {
  try {
    const r = await fetch(
      "https://news.google.com/rss/search?q=" +
        encodeURIComponent("mercados financieros OR wall street OR acciones when:2d") +
        "&hl=es-419&gl=US&ceid=US:es-419",
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
    );
    if (!r.ok) return [];
    const xml = await r.text();
    const items = xml.split("<item>").slice(1);
    const pick = (block: string, tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    };
    return items
      .map((block) => {
        const rawTitle = pick(block, "title");
        const source = pick(block, "source");
        const title = source
          ? rawTitle.replace(new RegExp(` - ${source}$`), "")
          : rawTitle;
        const link = pick(block, "link");
        const pub = pick(block, "pubDate");
        const time = pub ? Math.floor(Date.parse(pub) / 1000) : 0;
        return { title, publisher: source, link, time };
      })
      .filter((n) => n.title && n.link && n.time > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, 12);
  } catch {
    return [];
  }
}

// Noticias de mercado con imagen real (Finnhub).
async function finnhubNews(): Promise<News[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${key}`,
      { cache: "no-store" },
    );
    if (!r.ok) return [];
    const arr = await r.json();
    if (!Array.isArray(arr)) return [];
    return arr
      .map((n: {
        headline?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        summary?: string;
      }) => ({
        title: n.headline ?? "",
        publisher: n.source ?? "",
        link: n.url ?? "",
        time: n.datetime ?? 0,
        image: n.image || undefined,
        summary: n.summary || undefined,
      }))
      .filter((n: News) => n.title && n.link && n.time > 0)
      .slice(0, 18);
  } catch {
    return [];
  }
}

// --- Finnhub (requiere FINNHUB_API_KEY, gratis) ---

async function finnhubQuotes(list: { s: string; label: string }[]) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const out: Quote[] = [];
  for (const it of list) {
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${it.s}&token=${key}`,
        { cache: "no-store" },
      );
      if (!r.ok) continue;
      const j = await r.json();
      if (typeof j?.c !== "number" || j.c === 0) continue;
      out.push({ label: it.label, price: j.c, changePct: j.dp ?? null });
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [btc, fhNews, gNews, fhIndices, stocks] = await Promise.all([
    cryptoBTC(),
    finnhubNews(),
    googleNews(),
    finnhubQuotes(FINNHUB_INDICES),
    finnhubQuotes(FINNHUB_STOCKS),
  ]);

  // Preferimos las de Finnhub (traen foto); si no hay, caemos a Google News.
  const news = fhNews.length ? fhNews : gNews;
  const indices: Quote[] = [...fhIndices, ...(btc ? [btc] : [])];

  return Response.json(
    { indices, stocks, news },
    { headers: { "Cache-Control": "s-maxage=180, stale-while-revalidate=600" } },
  );
}
