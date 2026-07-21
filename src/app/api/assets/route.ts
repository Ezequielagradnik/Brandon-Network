import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// Lista curada de empresas destacadas del Nasdaq.
const FEATURED = [
  { s: "AAPL", name: "Apple Inc" },
  { s: "MSFT", name: "Microsoft" },
  { s: "NVDA", name: "NVIDIA" },
  { s: "AMZN", name: "Amazon" },
  { s: "GOOGL", name: "Alphabet" },
  { s: "META", name: "Meta Platforms" },
  { s: "TSLA", name: "Tesla" },
  { s: "ABNB", name: "Airbnb" },
  { s: "NFLX", name: "Netflix" },
  { s: "AMD", name: "AMD" },
];

const BASE = "https://finnhub.io/api/v1";

type Asset = {
  symbol: string;
  name: string;
  logo: string;
  price: number | null;
  changePct: number | null;
};

async function one(
  it: { s: string; name: string },
  key: string,
): Promise<Asset> {
  const asset: Asset = {
    symbol: it.s,
    name: it.name,
    logo: "",
    price: null,
    changePct: null,
  };
  try {
    const [q, p] = await Promise.all([
      fetch(`${BASE}/quote?symbol=${it.s}&token=${key}`, { cache: "no-store" }),
      fetch(`${BASE}/stock/profile2?symbol=${it.s}&token=${key}`, {
        cache: "no-store",
      }),
    ]);
    if (q.ok) {
      const j = await q.json();
      if (typeof j?.c === "number" && j.c !== 0) {
        asset.price = j.c;
        asset.changePct = j.dp ?? null;
      }
    }
    if (p.ok) {
      const j = await p.json();
      if (j?.logo) asset.logo = j.logo;
      if (j?.name) asset.name = j.name;
    }
  } catch {
    /* devolvemos lo que haya */
  }
  return asset;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return Response.json({ assets: [] });

  const assets = await Promise.all(FEATURED.map((it) => one(it, key)));

  return Response.json(
    { assets },
    { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=600" } },
  );
}
