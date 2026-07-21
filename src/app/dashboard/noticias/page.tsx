"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import AssetsCard from "@/components/AssetsCard";
import MarketInsightsCard from "@/components/MarketInsightsCard";
import ArticleReader, { type News } from "@/components/ArticleReader";

type Data = { news: News[] };

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

  return (
    <div className="flex h-full flex-col px-6 py-6 lg:px-8">
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
