"use client";

import { useEffect, useState } from "react";

// Logo real de la empresa (URL de Finnhub). Si no carga, cae a la inicial.
export default function CompanyLogo({
  logo,
  symbol,
  size = 40,
}: {
  logo?: string;
  symbol: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);

  useEffect(() => {
    setErr(false);
  }, [logo, symbol]);

  const box = { width: size, height: size };

  if (logo && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={symbol}
        style={box}
        onError={() => setErr(true)}
        className="shrink-0 rounded-xl object-contain ring-1 ring-navy/10"
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
