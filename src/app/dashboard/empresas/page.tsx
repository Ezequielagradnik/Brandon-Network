"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/components/LangProvider";
import CompanyDetail from "@/components/CompanyDetail";
import ArticleReader, { type News } from "@/components/ArticleReader";

type Company = { symbol: string; name: string; mic: string | null };

const MIC_LABEL: Record<string, string> = {
  XNGS: "Nasdaq Global Select",
  XNMS: "Nasdaq Global Market",
  XNCM: "Nasdaq Capital Market",
  XNAS: "Nasdaq",
};

export default function EmpresasPage() {
  const { t } = useLang();

  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);
  const [article, setArticle] = useState<News | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(term: string, offset: number, append: boolean) {
    setLoading(true);
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    params.set("offset", String(offset));
    fetch(`/api/companies?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCompanies((prev) =>
          append ? [...prev, ...(d.companies ?? [])] : (d.companies ?? []),
        );
        setTotal(d.total ?? 0);
        setHasMore(Boolean(d.hasMore));
      })
      .catch(() => {
        if (!append) setCompanies([]);
      })
      .finally(() => setLoading(false));
  }

  // Búsqueda con debounce
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchPage(q, 0, false), 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function ago(unixSec: number) {
    if (!unixSec) return "";
    const min = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (min < 60) return t.noticias.agoMin.replace("{n}", String(min));
    return t.noticias.agoH.replace("{n}", String(Math.round(min / 60)));
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader
        title={t.empresas.title}
        accent={t.empresas.accent}
        subtitle={t.empresas.subtitle}
      />

      {selected ? (
        <div className="animate-fade-up mt-8">
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
            onOpen={setArticle}
            ago={ago}
          />
        </div>
      ) : (
        <>
          {/* Buscador */}
          <div className="mt-8 flex items-center gap-2 rounded-[var(--radius-card)] border border-navy/15 bg-white px-4 py-3 shadow-[0_8px_30px_-18px_rgba(11,27,46,0.25)] transition-colors focus-within:border-gold/50">
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
              placeholder={t.empresas.placeholder}
              className="flex-1 bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
            />
          </div>

          {total > 0 && (
            <p className="mt-3 text-xs text-navy/45">
              {t.empresas.count.replace("{n}", total.toLocaleString("es-AR"))}
            </p>
          )}

          {/* Tabla */}
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
            {loading && companies.length === 0 ? (
              <div className="divide-y divide-navy/[0.06]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="h-4 w-16 rounded bg-navy/10" />
                    <div className="h-4 w-48 rounded bg-navy/10" />
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-navy/50">
                {q.trim() ? t.empresas.noResults : t.empresas.empty}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-navy/[0.03] text-left text-xs uppercase tracking-wide text-navy/50">
                  <tr>
                    <th className="w-28 px-5 py-3 font-medium">{t.empresas.colSymbol}</th>
                    <th className="px-5 py-3 font-medium">{t.empresas.colName}</th>
                    <th className="hidden px-5 py-3 font-medium sm:table-cell">
                      {t.empresas.colMarket}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.06]">
                  {companies.map((c) => (
                    <tr
                      key={c.symbol}
                      onClick={() => setSelected(c)}
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

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => fetchPage(q, companies.length, true)}
                disabled={loading}
                className="rounded-lg border border-navy/15 px-5 py-2 text-sm font-medium text-navy/70 transition-colors hover:border-gold/40 hover:text-navy disabled:opacity-50"
              >
                {t.empresas.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      <ArticleReader article={article} onClose={() => setArticle(null)} ago={ago} />
    </div>
  );
}
