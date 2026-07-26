export const maxDuration = 15;

// Endpoint público (landing): cotizaciones reales de 3 empresas, cacheadas ~1 min.
const SYMBOLS = [
  { s: "AAPL", n: "Apple" },
  { s: "NVDA", n: "NVIDIA" },
  { s: "TSLA", n: "Tesla" },
];

export async function GET() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ quotes: [] });

  const quotes = await Promise.all(
    SYMBOLS.map(async (it) => {
      try {
        const r = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${it.s}&token=${key}`,
          { cache: "no-store" },
        );
        if (!r.ok) return { symbol: it.s, name: it.n, price: null, changePct: null };
        const j = await r.json();
        return {
          symbol: it.s,
          name: it.n,
          price: typeof j?.c === "number" && j.c ? j.c : null,
          changePct: typeof j?.dp === "number" ? j.dp : null,
        };
      } catch {
        return { symbol: it.s, name: it.n, price: null, changePct: null };
      }
    }),
  );

  return Response.json(
    { quotes },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
  );
}
