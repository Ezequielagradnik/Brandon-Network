"use client";

import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import type { News } from "@/components/ArticleReader";

// Miniatura de la noticia; si la imagen falla, no ocupa lugar.
function NewsThumb({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="w-24 shrink-0 self-stretch object-cover sm:w-28"
    />
  );
}

export default function MarketInsightsCard({
  news,
  loading,
  onOpen,
  ago,
}: {
  news: News[];
  loading: boolean;
  onOpen: (n: News) => void;
  ago: (t: number) => string;
}) {
  const { t } = useLang();
  const shown = news;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white shadow-[0_10px_40px_-24px_rgba(11,27,46,0.35)]">
      <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
        <h2 className="font-display text-2xl text-navy">
          {t.noticias.companies.marketInsights}
        </h2>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-navy/10 p-4"
              >
                <div className="h-3 w-24 rounded bg-navy/10" />
                <div className="mt-2.5 h-4 w-full rounded bg-navy/10" />
                <div className="mt-1.5 h-4 w-4/5 rounded bg-navy/10" />
              </div>
            ))
          : shown.map((n, i) => (
              <button
                key={i}
                onClick={() => onOpen(n)}
                className="group flex w-full overflow-hidden rounded-xl border border-navy/10 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_-14px_rgba(11,27,46,0.2)]"
              >
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-center gap-2 text-xs text-navy/45">
                    <span className="font-medium text-navy/65">{n.publisher}</span>
                    <span>·</span>
                    <span className="tabular">{ago(n.time)}</span>
                  </div>
                  <h3 className="mt-2 text-[15px] font-medium leading-snug text-navy group-hover:text-gold">
                    {n.title}
                  </h3>
                </div>
                {n.image && <NewsThumb src={n.image} alt={n.publisher} />}
              </button>
            ))}
      </div>
    </div>
  );
}
