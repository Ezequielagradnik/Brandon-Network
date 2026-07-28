"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import AssetsCard from "@/components/AssetsCard";
import MarketInsightsCard from "@/components/MarketInsightsCard";
import { type News } from "@/components/ArticleReader";
import { newsId, NEWS_STASH_PREFIX } from "@/lib/newsId";

type Data = { news: News[] };

export default function NoticiasPage() {
  const { t } = useLang();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Guardamos la nota y navegamos a su página completa.
  function open(n: News) {
    const id = newsId(n.link);
    try {
      sessionStorage.setItem(NEWS_STASH_PREFIX + id, JSON.stringify(n));
    } catch {
      /* sin sessionStorage igual navegamos */
    }
    router.push(`/dashboard/noticias/${id}`);
  }

  return (
    <div className="flex h-full flex-col px-6 py-6 lg:px-8">
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2 lg:grid-rows-1">
        <div className="h-[72vh] min-h-0 lg:h-full">
          <AssetsCard onOpen={open} ago={ago} />
        </div>
        <div className="h-[72vh] min-h-0 lg:h-full">
          <MarketInsightsCard
            news={data?.news ?? []}
            loading={loading}
            onOpen={open}
            ago={ago}
          />
        </div>
      </div>
    </div>
  );
}
