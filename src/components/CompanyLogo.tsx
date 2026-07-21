"use client";

import { useEffect, useState } from "react";

// Logo real de la empresa. Intenta, en orden:
// 1) el logo explícito (Finnhub, para destacados/detalle)
// 2) el CDN de logos por ticker (FMP, cubre casi todo el Nasdaq)
// 3) la inicial como último recurso.
export default function CompanyLogo({
  logo,
  symbol,
  size = 40,
}: {
  logo?: string;
  symbol: string;
  size?: number;
}) {
  const candidates: string[] = [];
  if (logo) candidates.push(logo);
  if (symbol)
    candidates.push(
      `https://financialmodelingprep.com/image-stock/${encodeURIComponent(
        symbol,
      )}.png`,
    );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [logo, symbol]);

  const box = { width: size, height: size };
  const src = candidates[idx];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={symbol}
        loading="lazy"
        style={box}
        onError={() => setIdx((i) => i + 1)}
        className="shrink-0 rounded-xl bg-white object-contain ring-1 ring-navy/10"
      />
    );
  }

  return (
    <div
      style={box}
      className="flex shrink-0 items-center justify-center rounded-xl bg-navy/5 font-display text-navy/60"
    >
      {symbol.slice(0, 1)}
    </div>
  );
}
