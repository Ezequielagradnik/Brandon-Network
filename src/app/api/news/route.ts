import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type Quote = { label: string; price: number; changePct: number | null };
type News = { title: string; publisher: string; link: string; time: number };

const FINNHUB_INDICES = [
  { s: "SPY", label: "S&P 500" },
  { s: "QQQ", label: "Nasdaq" },
  { s: "DIA", label: "Dow Jones" },
  { s: "IWM", label: "Russell 2000" },
  { s: "GLD", label: "Oro" },
  { s: "USO", label: "Petróleo" },
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

async function crypto(): Promise<Quote[]> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" },
    );
    if (!r.ok) return [];
    const j = await r.json();
    const out: Quote[] = [];
    if (j?.bitcoin)
      out.push({
        label: "Bitcoin",
        price: j.bitcoin.usd,
        changePct: j.bitcoin.usd_24h_change ?? null,
      });
    if (j?.ethereum)
      out.push({
        label: "Ethereum",
        price: j.ethereum.usd,
        changePct: j.ethereum.usd_24h_change ?? null,
      });
    return out;
  } catch {
    return [];
  }
}

async function dolares(): Promise<Quote[]> {
  const sources = [
    { url: "https://dolarapi.com/v1/dolares/blue", label: "Dólar blue" },
    { url: "https://dolarapi.com/v1/dolares/oficial", label: "Dólar oficial" },
    { url: "https://dolarapi.com/v1/dolares/bolsa", label: "Dólar MEP" },
    { url: "https://dolarapi.com/v1/cotizaciones/eur", label: "Euro" },
  ];
  const found = new Map<string, Quote>();
  await Promise.all(
    sources.map(async (s) => {
      try {
        const r = await fetch(s.url, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (typeof j?.venta === "number") {
          found.set(s.label, { label: s.label, price: j.venta, changePct: null });
        }
      } catch {
        /* skip */
      }
    }),
  );
  // Mantener el orden de `sources`
  return sources
    .map((s) => found.get(s.label))
    .filter((q): q is Quote => Boolean(q));
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

  const [cryptos, dolar, news, fhIndices, stocks] = await Promise.all([
    crypto(),
    dolares(),
    googleNews(),
    finnhubQuotes(FINNHUB_INDICES),
    finnhubQuotes(FINNHUB_STOCKS),
  ]);

  const indices: Quote[] = [...fhIndices, ...cryptos, ...dolar];

  return Response.json(
    { indices, stocks, news },
    { headers: { "Cache-Control": "s-maxage=180, stale-while-revalidate=600" } },
  );
}
