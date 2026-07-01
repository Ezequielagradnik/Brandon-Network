"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import { useLang } from "@/components/LangProvider";
import { MARKET_INDICES, NEWS, NEWS_CATEGORIES } from "@/lib/mock";

export default function NoticiasPage() {
  const { t } = useLang();
  const [category, setCategory] = useState("Todas");

  const filtered =
    category === "Todas" ? NEWS : NEWS.filter((n) => n.category === category);

  const catLabel = (c: string) =>
    (t.noticias.cat as Record<string, string>)[c] ?? c;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      {/* Barra de índices */}
      <div className="animate-fade-up mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-navy/10 sm:grid-cols-4">
        {MARKET_INDICES.map((idx) => {
          const up = idx.changePct >= 0;
          return (
            <div key={idx.label} className="bg-white px-5 py-4">
              <p className="text-xs text-navy/50">{idx.label}</p>
              <p className="tabular mt-1 text-lg font-medium text-navy">{idx.value}</p>
              <p
                className="tabular mt-0.5 text-xs font-medium"
                style={{ color: up ? "var(--up)" : "var(--down)" }}
              >
                {up ? "▲" : "▼"} {Math.abs(idx.changePct).toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>

      <PageHeader
        title={t.noticias.title}
        accent={t.noticias.accent}
        subtitle={t.noticias.subtitle}
      />

      {/* Filtros */}
      <div className="mt-8 flex flex-wrap gap-2">
        {NEWS_CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "border-navy bg-navy text-ivory"
                  : "border-navy/15 text-navy/60 hover:border-navy/30 hover:text-navy"
              }`}
            >
              {catLabel(cat)}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            labels={{ agoMin: t.noticias.agoMin, agoH: t.noticias.agoH }}
          />
        ))}
      </div>
    </div>
  );
}
