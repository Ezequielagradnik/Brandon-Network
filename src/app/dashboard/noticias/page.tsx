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
      {/* Franja de índices */}
      <div className="no-scrollbar -mx-2 flex shrink-0 gap-2 overflow-x-auto px-2 pb-4">
        {(indices.length ? indices : Array.from({ length: 6 })).map((idx, i) => {
          const q = idx as Quote | undefined;
          const up = q?.changePct != null && q.changePct >= 0;
          return (
            <div
              key={i}
              className="flex min-w-[130px] shrink-0 flex-col rounded-xl border border-navy/10 bg-white px-4 py-2.5"
            >
              {q ? (
                <>
                  <span className="text-[11px] text-navy/50">{q.label}</span>
                  <span className="tabular mt-0.5 text-base font-medium text-navy">
                    {fmt(q.price)}
                  </span>
                  {q.changePct != null && (
                    <span
                      className="tabular text-[11px] font-medium"
                      style={{ color: up ? "var(--up)" : "var(--down)" }}
                    >
                      {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
                    </span>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-2.5 w-14 rounded bg-navy/10" />
                  <div className="h-3.5 w-16 rounded bg-navy/10" />
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
