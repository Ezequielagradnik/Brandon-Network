"use client";

import { useState } from "react";
import { useLang } from "@/components/LangProvider";

const TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "NFLX",
  "AMD",
  "JPM",
  "COST",
  "AVGO",
  "ADBE",
  "PEP",
];

function Logo({ ticker }: { ticker: string }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://financialmodelingprep.com/image-stock/${ticker}.png`}
      alt={ticker}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-9 w-auto shrink-0 object-contain opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
    />
  );
}

export default function LogoMarquee() {
  const { t } = useLang();
  const list = [...TICKERS, ...TICKERS];

  return (
    <section className="border-y border-navy/10 bg-white/50 py-12">
      <p className="mb-8 text-center text-xs uppercase tracking-[0.18em] text-navy/40">
        {t.about.marqueeLabel}
      </p>
      <div className="marquee-mask group overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-14">
          {list.map((tk, i) => (
            <Logo key={i} ticker={tk} />
          ))}
        </div>
      </div>
    </section>
  );
}
