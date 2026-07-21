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

// Feed de noticias con foto real y fuentes variadas: juntamos las noticias
// de varias empresas grandes (traen foto de la nota, no el logo de la agencia).
const NEWS_TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "TSLA",
  "META",
  "GOOGL",
  "JPM",
];

type FinnhubArticle = {
  headline?: string;
  source?: string;
  url?: string;
  datetime?: number;
  image?: string;
  summary?: string;
};

// Solo estas fuentes: traen imágenes reales y relevantes (no logos ni stock genérico).
// Finnhub (feed gratis) solo devuelve Yahoo, Benzinga, SeekingAlpha, CNBC y
// ChartMill para estos tickers. Nos quedamos con las de imágenes buenas.
const ALLOWED_SOURCES = ["seekingalpha", "benzinga", "cnbc"];
const normSource = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

async function finnhubNews(): Promise<News[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];

  const to = new Date();
  const from = new Date(to.getTime() - 4 * 86400000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const perTicker = await Promise.all(
      NEWS_TICKERS.map(async (s) => {
        try {
          const r = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${s}&from=${ymd(from)}&to=${ymd(to)}&token=${key}`,
            { cache: "no-store" },
          );
          if (!r.ok) return [] as FinnhubArticle[];
          const arr = await r.json();
          return (Array.isArray(arr) ? arr : []) as FinnhubArticle[];
        } catch {
          return [] as FinnhubArticle[];
        }
      }),
    );

    const all = perTicker
      .flat()
      .map((n) => ({
        title: n.headline ?? "",
        publisher: n.source ?? "",
        link: n.url ?? "",
        time: n.datetime ?? 0,
        image: n.image || undefined,
        summary: n.summary || undefined,
      }))
      .filter(
        (n) =>
          n.title &&
          n.link &&
          n.time > 0 &&
          n.image &&
          ALLOWED_SOURCES.some((a) => normSource(n.publisher).includes(a)),
      )
      .sort((a, b) => b.time - a.time);

    // Dedupe por URL y por imagen (evita notas repetidas y logos repetidos)
    const seenUrl = new Set<string>();
    const seenImg = new Set<string>();
    const out: News[] = [];
    for (const n of all) {
      if (seenUrl.has(n.link)) continue;
      if (n.image && seenImg.has(n.image)) continue;
      seenUrl.add(n.link);
      if (n.image) seenImg.add(n.image);
      out.push(n);
      if (out.length >= 24) break;
    }
    return out;
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
