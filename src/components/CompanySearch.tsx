"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import CompanyDetail from "@/components/CompanyDetail";
import type { News } from "@/components/ArticleReader";

type Match = { symbol: string; description: string; type: string };
type Company = { symbol: string; name: string; mic: string | null };

const MIC_LABEL: Record<string, string> = {
  XNGS: "Nasdaq Global Select",
  XNMS: "Nasdaq Global Market",
  XNCM: "Nasdaq Capital Market",
  XNAS: "Nasdaq",
};

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
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(
    null,
  );
  const [noKey, setNoKey] = useState(false);

  // Directorio del Nasdaq (desde Supabase)
  const [dir, setDir] = useState<Company[]>([]);
  const [dirTotal, setDirTotal] = useState(0);
  const [dirHasMore, setDirHasMore] = useState(false);
  const [dirLoading, setDirLoading] = useState(true);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowList(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Autocompletado en vivo (Finnhub)
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

  // Directorio del Nasdaq (paginado)
  function fetchDir(offset: number, append: boolean) {
    setDirLoading(true);
    fetch(`/api/companies?offset=${offset}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setDir((prev) =>
          append ? [...prev, ...(d.companies ?? [])] : (d.companies ?? []),
        );
        setDirTotal(d.total ?? 0);
        setDirHasMore(Boolean(d.hasMore));
      })
      .catch(() => {
        if (!append) setDir([]);
      })
      .finally(() => setDirLoading(false));
  }

  useEffect(() => {
    fetchDir(0, false);
  }, []);

  function pick(symbol: string, name: string) {
    setShowList(false);
    setSelected({ symbol, name });
  }

  return (
    <div>
      <h2 className="mt-12 mb-1 font-display text-2xl text-navy">
        {t.noticias.companies.title}{" "}
        <span className="italic text-gold">{t.noticias.companies.accent}</span>
      </h2>
      <p className="mb-4 text-sm text-navy/55">{t.noticias.companies.subtitle}</p>

      {/* Buscador en vivo */}
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

        {showList && (matches.length > 0 || (!searching && q.trim())) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white py-1 shadow-[0_20px_50px_-20px_rgba(11,27,46,0.4)]">
            {matches.length > 0 ? (
              matches.map((m) => (
                <button
                  key={m.symbol}
                  type="button"
                  onClick={() => {
                    setQ(m.description);
                    pick(m.symbol, m.description);
                  }}
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

      {/* Detalle de la empresa elegida, o directorio del Nasdaq */}
      {selected ? (
        <div className="mt-6">
          <button
            onClick={() => setSelected(null)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-navy/60 transition-colors hover:text-navy"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t.empresas.back}
          </button>
          <CompanyDetail
            symbol={selected.symbol}
            fallbackName={selected.name}
            onOpen={onOpen}
            ago={ago}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h3 className="font-display text-xl text-navy">
              {t.empresas.title}{" "}
              <span className="italic text-gold">{t.empresas.accent}</span>
            </h3>
            {dirTotal > 0 && (
              <span className="text-xs text-navy/45">
                {t.empresas.count.replace("{n}", dirTotal.toLocaleString("es-AR"))}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
            {dirLoading && dir.length === 0 ? (
              <div className="divide-y divide-navy/[0.06]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="h-4 w-16 rounded bg-navy/10" />
                    <div className="h-4 w-48 rounded bg-navy/10" />
                  </div>
                ))}
              </div>
            ) : dir.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-navy/50">
                {t.empresas.empty}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-navy/[0.03] text-left text-xs uppercase tracking-wide text-navy/50">
                  <tr>
                    <th className="w-28 px-5 py-3 font-medium">
                      {t.empresas.colSymbol}
                    </th>
                    <th className="px-5 py-3 font-medium">{t.empresas.colName}</th>
                    <th className="hidden px-5 py-3 font-medium sm:table-cell">
                      {t.empresas.colMarket}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.06]">
                  {dir.map((c) => (
                    <tr
                      key={c.symbol}
                      onClick={() => pick(c.symbol, c.name)}
                      className="cursor-pointer transition-colors hover:bg-navy/[0.03]"
                    >
                      <td className="px-5 py-3">
                        <span className="tabular rounded-md bg-navy/[0.06] px-2 py-0.5 text-xs font-medium text-navy/75">
                          {c.symbol}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-navy">{c.name}</td>
                      <td className="hidden px-5 py-3 text-navy/55 sm:table-cell">
                        {c.mic ? MIC_LABEL[c.mic] ?? "Nasdaq" : "Nasdaq"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {dirHasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => fetchDir(dir.length, true)}
                disabled={dirLoading}
                className="rounded-lg border border-navy/15 px-5 py-2 text-sm font-medium text-navy/70 transition-colors hover:border-gold/40 hover:text-navy disabled:opacity-50"
              >
                {t.empresas.loadMore}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
