"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import AssetsCard from "@/components/AssetsCard";
import MarketInsightsCard from "@/components/MarketInsightsCard";
import ArticleReader, { type News } from "@/components/ArticleReader";

type Quote = { label: string; price: number; changePct: number | null };
type Data = { indices: Quote[]; stocks: Quote[]; news: News[] };

function fmt(n: number) {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function NoticiasPage() {
  const { t } = useLang();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<News | null>(null);

  useEffect(() => {
    fetch("/api/news", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function ago(unixSec: number) {
    if (!unixSec) return "";
    const min = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (min < 60) return t.noticias.agoMin.replace("{n}", String(min));
    return t.noticias.agoH.replace("{n}", String(Math.round(min / 60)));
  }

  const indices = data?.indices ?? [];

  return (
    <div className="flex h-full flex-col px-6 py-6 lg:px-8">
      {/* Franja de índices (todo en USD) */}
      <div className="grid shrink-0 grid-cols-2 gap-3 pb-5 sm:grid-cols-3 lg:grid-cols-5">
        {(indices.length ? indices : Array.from({ length: 5 })).map((idx, i) => {
          const q = idx as Quote | undefined;
          const up = q?.changePct != null && q.changePct >= 0;
          return (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-navy/10 bg-white px-5 py-4"
            >
              {q ? (
                <>
                  <span className="text-xs text-navy/50">{q.label}</span>
                  <span className="tabular mt-1.5 text-2xl font-medium text-navy">
                    ${fmt(q.price)}
                  </span>
                  {q.changePct != null && (
                    <span
                      className="tabular mt-1 text-sm font-medium"
                      style={{ color: up ? "var(--up)" : "var(--down)" }}
                    >
                      {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
                    </span>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-navy/10" />
                  <div className="h-6 w-24 rounded bg-navy/10" />
                  <div className="h-3 w-12 rounded bg-navy/10" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dos cards con scroll interno */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2 lg:grid-rows-1">
        <div className="h-[72vh] min-h-0 lg:h-full">
          <AssetsCard onOpen={setArticle} ago={ago} />
        </div>
        <div className="h-[72vh] min-h-0 lg:h-full">
          <MarketInsightsCard
            news={data?.news ?? []}
            loading={loading}
            onOpen={setArticle}
            ago={ago}
          />
        </div>
      </div>

      <ArticleReader article={article} onClose={() => setArticle(null)} ago={ago} />
    </div>
  );
}
