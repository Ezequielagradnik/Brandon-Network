"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import CompanyLogo from "@/components/CompanyLogo";
import type { News } from "@/components/ArticleReader";

type Asset = {
  symbol: string;
  name: string;
  logo: string;
  price: number | null;
  changePct: number | null;
};
type Match = { symbol: string; description: string; type: string };
type Company = { symbol: string; name: string; mic: string | null };
type Profile = {
  name: string;
  ticker: string;
  exchange: string;
  logo: string;
  industry: string;
  currency: string;
};
type Quote = { price: number; changePct: number | null };
type DetailNews = News & { summary?: string };
type Detail = { profile: Profile | null; quote: Quote | null; news: DetailNews[] };

function fmt(n: number) {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Pct({ v }: { v: number | null }) {
  if (v === null || v === undefined) return null;
  const up = v >= 0;
  return (
    <span
      className="tabular text-xs font-medium"
      style={{ color: up ? "var(--up)" : "var(--down)" }}
    >
      {up ? "▲" : "▼"} {Math.abs(v).toFixed(2)}%
    </span>
  );
}

export default function AssetsCard({
  onOpen,
  ago,
}: {
  onOpen: (n: News) => void;
  ago: (t: number) => string;
}) {
  const { t } = useLang();
  const [featured, setFeatured] = useState<Asset[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [dir, setDir] = useState<Company[]>([]);
  const [dirHasMore, setDirHasMore] = useState(false);

  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  const [selected, setSelected] = useState<{ symbol: string; name: string; logo?: string } | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/assets", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setFeatured(d.assets ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const term = q.trim();
    if (!term) {
      setMatches([]);
      return;
    }
    debounce.current = setTimeout(() => {
      fetch(`/api/ticker?q=${encodeURIComponent(term)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setMatches(Array.isArray(d?.matches) ? d.matches : []))
        .catch(() => setMatches([]));
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  function loadDir(offset: number) {
    fetch(`/api/companies?offset=${offset}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setDir((prev) =>
          offset === 0 ? (d.companies ?? []) : [...prev, ...(d.companies ?? [])],
        );
        setDirHasMore(Boolean(d.hasMore));
      })
      .catch(() => {});
  }

  function toggleAll() {
    const next = !showAll;
    setShowAll(next);
    if (next && dir.length === 0) loadDir(0);
  }

  function open(symbol: string, name: string, logo?: string) {
    setSelected({ symbol, name, logo });
    setDetail(null);
    setLoadingDetail(true);
    fetch(`/api/ticker?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Detail) => setDetail(d))
      .catch(() => setDetail({ profile: null, quote: null, news: [] }))
      .finally(() => setLoadingDetail(false));
  }

  // ---------- Detalle ----------
  if (selected) {
    const p = detail?.profile;
    const name = p?.name ?? selected.name;
    const logo = p?.logo ?? selected.logo;
    const quote = detail?.quote;
    const up = quote?.changePct != null && quote.changePct >= 0;
    const news = detail?.news ?? [];

    return (
      <Card>
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-gold/40 hover:text-navy"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t.noticias.companies.back}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyLogo logo={logo} symbol={selected.symbol} size={48} />
              <div className="min-w-0">
                <p className="font-display text-2xl leading-tight text-navy">
                  {selected.symbol}
                </p>
                <p className="truncate text-sm text-navy/55">{name}</p>
              </div>
            </div>
            {quote && (
              <div className="shrink-0 text-right">
                <p className="tabular text-2xl font-medium text-navy">
                  ${fmt(quote.price)}
                </p>
                {quote.changePct != null && (
                  <span
                    className="tabular text-sm font-medium"
                    style={{ color: up ? "var(--up)" : "var(--down)" }}
                  >
                    {up ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {loadingDetail ? (
            <div className="mt-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-navy/10" />
              ))}
            </div>
          ) : (
            <>
              {/* Puntos clave = titulares recientes */}
              {news.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-navy/45">
                    {t.noticias.companies.keyPoints}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {news.slice(0, 3).map((n, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-navy">
                        <span className="text-gold">⚡</span>
                        <span className="leading-snug">{n.title}</span>
                      </li>
                    ))}
                  </ul>
                  {news[0]?.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-navy/60">
                      {news[0].summary.slice(0, 320)}
                    </p>
                  )}
                </div>
              )}

              {/* Últimas noticias */}
              <p className="mt-7 text-xs font-medium uppercase tracking-wide text-navy/45">
                {t.noticias.companies.latestNews}
              </p>
              {news.length === 0 ? (
                <p className="mt-2 text-sm text-navy/55">
                  {t.noticias.companies.noNews}
                </p>
              ) : (
                <div className="mt-2 divide-y divide-navy/[0.06]">
                  {news.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => onOpen(n)}
                      className="group flex w-full gap-3 py-3 text-left"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-down/70" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-navy/45">
                          <span>{ago(n.time)}</span>
                          <span>·</span>
                          <span className="truncate">{n.publisher}</span>
                        </div>
                        <p className="mt-0.5 text-sm font-medium leading-snug text-navy group-hover:text-gold">
                          {n.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    );
  }

  // ---------- Lista ----------
  const searching = q.trim().length > 0;

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
        <h2 className="font-display text-2xl text-navy">
          {t.noticias.companies.assets}
        </h2>
        <button
          onClick={toggleAll}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy/60 transition-colors hover:border-gold/40 hover:text-navy"
        >
          {showAll ? t.noticias.companies.verMenos : t.noticias.companies.verTodo}
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 transition-colors focus-within:border-gold/50">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-navy/40">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.noticias.companies.searchTicker}
            className="flex-1 bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
        {searching ? (
          matches.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-navy/45">
              {t.noticias.companies.noResults}
            </p>
          ) : (
            matches.map((m) => (
              <Row
                key={m.symbol}
                symbol={m.symbol}
                name={m.description}
                onClick={() => open(m.symbol, m.description)}
              />
            ))
          )
        ) : showAll ? (
          <>
            {dir.map((c) => (
              <Row
                key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                onClick={() => open(c.symbol, c.name)}
              />
            ))}
            {dirHasMore && (
              <button
                onClick={() => loadDir(dir.length)}
                className="mt-2 w-full rounded-lg py-2 text-xs font-medium text-navy/60 transition-colors hover:text-navy"
              >
                {t.noticias.companies.verTodo}
              </button>
            )}
          </>
        ) : loadingList ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <div className="h-10 w-10 rounded-xl bg-navy/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-navy/10" />
                <div className="h-3 w-16 rounded bg-navy/10" />
              </div>
            </div>
          ))
        ) : (
          featured.map((a) => (
            <button
              key={a.symbol}
              onClick={() => open(a.symbol, a.name, a.logo)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ivory/70"
            >
              <CompanyLogo logo={a.logo} symbol={a.symbol} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">{a.symbol}</p>
                <p className="truncate text-xs text-navy/50">{a.name}</p>
              </div>
              <div className="shrink-0 text-right">
                {a.price != null && (
                  <p className="tabular text-sm font-medium text-navy">
                    ${fmt(a.price)}
                  </p>
                )}
                <Pct v={a.changePct} />
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white shadow-[0_10px_40px_-24px_rgba(11,27,46,0.35)]">
      {children}
    </div>
  );
}

function Row({
  symbol,
  name,
  onClick,
}: {
  symbol: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ivory/70"
    >
      <CompanyLogo symbol={symbol} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{symbol}</p>
        <p className="truncate text-xs text-navy/50">{name}</p>
      </div>
    </button>
  );
}
