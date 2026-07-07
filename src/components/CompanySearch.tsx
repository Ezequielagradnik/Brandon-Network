"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLang } from "@/components/LangProvider";

export type News = {
  title: string;
  publisher: string;
  link: string;
  time: number;
};
type Match = { symbol: string; description: string; type: string };
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

export default function CompanySearch({
  onOpen,
  ago,
}: {
  onOpen: (n: News) => void;
  ago: (t: number) => string;
}) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searching, setSearching] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [noKey, setNoKey] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar el dropdown al hacer click afuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const term = q.trim();
    if (term.length < 1) {
      setMatches([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(() => {
      fetch(`/api/ticker?q=${encodeURIComponent(term)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d?.error === "sin_key") setNoKey(true);
          setMatches(Array.isArray(d?.matches) ? d.matches : []);
          setShowList(true);
        })
        .catch(() => setMatches([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  function pick(m: Match) {
    setShowList(false);
    setQ(m.description);
    setSelected({
      name: m.description,
      ticker: m.symbol,
      exchange: "",
      logo: "",
      industry: "",
      currency: "USD",
      weburl: "",
    });
    setDetail(null);
    setLoadingDetail(true);
    fetch(`/api/ticker?symbol=${encodeURIComponent(m.symbol)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: Detail) => {
        setDetail(d);
        if (d?.profile) setSelected(d.profile);
      })
      .catch(() => setDetail({ profile: null, quote: null, news: [] }))
      .finally(() => setLoadingDetail(false));
  }

  const up = detail?.quote?.changePct != null && detail.quote.changePct >= 0;

  return (
    <div>
      <h2 className="mt-12 mb-1 font-display text-2xl text-navy">
        {t.noticias.companies.title}{" "}
        <span className="italic text-gold">{t.noticias.companies.accent}</span>
      </h2>
      <p className="mb-4 text-sm text-navy/55">{t.noticias.companies.subtitle}</p>

      {/* Buscador */}
      <div ref={boxRef} className="relative max-w-xl">
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-navy/15 bg-white px-4 py-3 shadow-[0_8px_30px_-18px_rgba(11,27,46,0.25)] transition-colors focus-within:border-gold/50">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="shrink-0 text-navy/40"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => matches.length && setShowList(true)}
            placeholder={t.noticias.companies.placeholder}
            className="flex-1 bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
          />
          {searching && (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-navy/15 border-t-gold" />
          )}
        </div>

        {/* Dropdown de resultados */}
        {showList && (matches.length > 0 || (!searching && q.trim())) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white py-1 shadow-[0_20px_50px_-20px_rgba(11,27,46,0.4)]">
            {matches.length > 0 ? (
              matches.map((m) => (
                <button
                  key={m.symbol}
                  type="button"
                  onClick={() => pick(m)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy/[0.04]"
                >
                  <span className="min-w-0 truncate text-sm text-navy">
                    {m.description}
                  </span>
                  <span className="tabular shrink-0 rounded-md bg-navy/[0.06] px-2 py-0.5 text-xs font-medium text-navy/70">
                    {m.symbol}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-navy/50">
                {noKey
                  ? t.noticias.companies.needKey
                  : t.noticias.companies.noResults}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Estado vacío */}
      {!selected && (
        <p className="mt-6 rounded-[var(--radius-card)] border border-dashed border-navy/15 bg-white/60 px-5 py-6 text-center text-sm text-navy/45">
          {t.noticias.companies.empty}
        </p>
      )}

      {/* Empresa seleccionada */}
      {selected && (
        <div className="animate-fade-up mt-6">
          {/* Tarjeta de perfil + cotización */}
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
            <div className="flex min-w-0 items-center gap-3">
              {selected.logo ? (
                <Image
                  src={selected.logo}
                  alt={selected.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-lg object-contain ring-1 ring-navy/10"
                  unoptimized
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 font-display text-lg text-navy/60">
                  {selected.ticker.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{selected.name}</p>
                <p className="text-xs text-navy/50">
                  {selected.ticker}
                  {selected.exchange ? ` · ${selected.exchange}` : ""}
                  {selected.industry ? ` · ${selected.industry}` : ""}
                </p>
              </div>
            </div>
            {detail?.quote && (
              <div className="shrink-0 text-right">
                <p className="tabular text-lg font-medium text-navy">
                  {selected.currency === "USD" ? "$" : ""}
                  {fmt(detail.quote.price)}
                </p>
                {detail.quote.changePct != null && (
                  <span
                    className="tabular text-xs font-medium"
                    style={{ color: up ? "var(--up)" : "var(--down)" }}
                  >
                    {up ? "▲" : "▼"} {Math.abs(detail.quote.changePct).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Novedades */}
          <h3 className="mt-6 mb-3 text-sm font-medium uppercase tracking-wide text-navy/50">
            {t.noticias.companies.latestNews}
          </h3>

          {loadingDetail ? (
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
      )}
    </div>
  );
}
