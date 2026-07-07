"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import CompanyDetail from "@/components/CompanyDetail";
import type { News } from "@/components/ArticleReader";

type Match = { symbol: string; description: string; type: string };

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
    setSelected({ symbol: m.symbol, name: m.description });
  }

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

      {/* Estado vacío / detalle */}
      {!selected ? (
        <p className="mt-6 rounded-[var(--radius-card)] border border-dashed border-navy/15 bg-white/60 px-5 py-6 text-center text-sm text-navy/45">
          {t.noticias.companies.empty}
        </p>
      ) : (
        <div className="mt-6">
          <CompanyDetail
            symbol={selected.symbol}
            fallbackName={selected.name}
            onOpen={onOpen}
            ago={ago}
          />
        </div>
      )}
    </div>
  );
}
