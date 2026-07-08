"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/components/LangProvider";
import TradingViewChart from "@/components/TradingViewChart";
import type { News } from "@/components/ArticleReader";

type Profile = {
  name: string;
  ticker: string;
  exchange: string;
  logo: string;
  industry: string;
  currency: string;
  weburl: string;
};
type Quote = { price: number; changePct: number | null };
type Detail = { profile: Profile | null; quote: Quote | null; news: News[] };

function fmt(n: number) {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CompanyDetail({
  symbol,
  fallbackName,
  onOpen,
  ago,
}: {
  symbol: string;
  fallbackName?: string;
  onOpen: (n: News) => void;
  ago: (t: number) => string;
}) {
  const { t } = useLang();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setDetail(null);
    setLoading(true);
    let cancel = false;
    fetch(`/api/ticker?symbol=${encodeURIComponent(symbol)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: Detail) => !cancel && setDetail(d))
      .catch(() => !cancel && setDetail({ profile: null, quote: null, news: [] }))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [symbol]);

  const profile = detail?.profile;
  const name = profile?.name ?? fallbackName ?? symbol;
  const quote = detail?.quote;
  const up = quote?.changePct != null && quote.changePct >= 0;

  return (
    <div className="animate-fade-up">
      {/* Perfil + cotización */}
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
        <div className="flex min-w-0 items-center gap-3">
          {profile?.logo ? (
            <Image
              src={profile.logo}
              alt={name}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-contain ring-1 ring-navy/10"
              unoptimized
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 font-display text-lg text-navy/60">
              {symbol.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-navy">{name}</p>
            <p className="text-xs text-navy/50">
              {profile?.ticker ?? symbol}
              {profile?.exchange ? ` · ${profile.exchange}` : ""}
              {profile?.industry ? ` · ${profile.industry}` : ""}
            </p>
          </div>
        </div>
        {quote && (
          <div className="shrink-0 text-right">
            <p className="tabular text-lg font-medium text-navy">
              {profile?.currency === "USD" || !profile ? "$" : ""}
              {fmt(quote.price)}
            </p>
            {quote.changePct != null && (
              <span
                className="tabular text-xs font-medium"
                style={{ color: up ? "var(--up)" : "var(--down)" }}
              >
                {up ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="mt-4">
        <TradingViewChart symbol={profile?.ticker ?? symbol} />
      </div>

      {/* Novedades */}
      <h3 className="mt-6 mb-3 text-sm font-medium uppercase tracking-wide text-navy/50">
        {t.noticias.companies.latestNews}
      </h3>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5"
            >
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-navy/10" />
                <div className="h-3.5 w-full rounded bg-navy/10" />
                <div className="h-3.5 w-4/5 rounded bg-navy/10" />
              </div>
            </div>
          ))}
        </div>
      ) : detail && detail.news.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {detail.news.map((n, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpen(n)}
              className="group flex flex-col rounded-[var(--radius-card)] border border-navy/10 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_-12px_rgba(11,27,46,0.18)]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-navy/70">{n.publisher}</span>
                <span className="tabular text-navy/45">{ago(n.time)}</span>
              </div>
              <p className="mt-3 text-[15px] font-medium leading-snug text-navy group-hover:text-gold">
                {n.title}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-card)] border border-navy/10 bg-white px-5 py-4 text-sm text-navy/55">
          {t.noticias.companies.noNews}
        </p>
      )}
    </div>
  );
}
