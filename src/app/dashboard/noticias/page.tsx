"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/components/LangProvider";

type Quote = { label: string; price: number; changePct: number | null };
type News = { title: string; publisher: string; link: string; time: number };
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
  const [error, setError] = useState(false);

  // Lector in-app
  const [article, setArticle] = useState<News | null>(null);
  const [content, setContent] = useState("");
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/news", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!article) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArticle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [article]);

  function openReader(n: News) {
    setArticle(n);
    setContent("");
    setFailed(false);
    setReading(true);
    fetch(`/api/article?url=${encodeURIComponent(n.link)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.content) setContent(d.content);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setReading(false));
  }

  function ago(unixSec: number) {
    if (!unixSec) return "";
    const min = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (min < 60) return t.noticias.agoMin.replace("{n}", String(min));
    return t.noticias.agoH.replace("{n}", String(Math.round(min / 60)));
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

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title={t.noticias.title}
        accent={t.noticias.accent}
        subtitle={t.noticias.subtitle}
      />

      {error && (
        <p className="mt-8 text-sm text-navy/50">
          No se pudieron cargar los datos de mercado. Probá recargar.
        </p>
      )}

      {/* Índices */}
      <div className="animate-fade-up mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-navy/10 sm:grid-cols-3 lg:grid-cols-6">
        {(data?.indices ?? Array.from({ length: 6 })).map((idx, i) => (
          <div key={i} className="bg-white px-5 py-4">
            {idx ? (
              <>
                <p className="text-xs text-navy/50">{(idx as Quote).label}</p>
                <p className="tabular mt-1 text-lg font-medium text-navy">
                  {fmt((idx as Quote).price)}
                </p>
                <div className="mt-0.5">
                  <Pct v={(idx as Quote).changePct} />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-navy/10" />
                <div className="h-4 w-20 rounded bg-navy/10" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Acciones */}
      <h2 className="mt-10 mb-4 font-display text-2xl text-navy">Acciones</h2>
      {data && data.stocks.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-navy/10 bg-white px-5 py-4 text-sm text-navy/55">
          Conectá una API key gratuita de Finnhub (var{" "}
          <code className="text-navy/70">FINNHUB_API_KEY</code>) para ver
          acciones e índices bursátiles. Bitcoin, dólar y noticias ya están
          conectados.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(data?.stocks ?? Array.from({ length: 8 })).map((q, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-4"
            >
              {q ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-navy">
                      {(q as Quote).label}
                    </span>
                    <Pct v={(q as Quote).changePct} />
                  </div>
                  <p className="tabular mt-2 text-lg font-medium text-navy">
                    ${fmt((q as Quote).price)}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-3 w-12 rounded bg-navy/10" />
                  <div className="h-4 w-16 rounded bg-navy/10" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Noticias */}
      <h2 className="mt-10 mb-4 font-display text-2xl text-navy">
        {t.noticias.title}{" "}
        <span className="italic text-gold">{t.noticias.accent}</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.news ?? Array.from({ length: 6 })).map((n, i) =>
          n ? (
            <button
              key={i}
              type="button"
              onClick={() => openReader(n as News)}
              className="group flex flex-col rounded-[var(--radius-card)] border border-navy/10 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_-12px_rgba(11,27,46,0.18)]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-navy/70">
                  {(n as News).publisher}
                </span>
                <span className="tabular text-navy/45">
                  {ago((n as News).time)}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-medium leading-snug text-navy group-hover:text-gold">
                {(n as News).title}
              </h3>
            </button>
          ) : (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5"
            >
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-navy/10" />
                <div className="h-3.5 w-full rounded bg-navy/10" />
                <div className="h-3.5 w-4/5 rounded bg-navy/10" />
              </div>
            </div>
          ),
        )}
      </div>

      {/* Lector in-app */}
      {article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            onClick={() => setArticle(null)}
            className="absolute inset-0 bg-[#0b1b2e]/50 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_30px_80px_-20px_rgba(11,27,46,0.5)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-navy/10 px-6 py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-navy/50">
                  <span className="font-medium text-navy/70">{article.publisher}</span>
                  <span>·</span>
                  <span className="tabular">{ago(article.time)}</span>
                </div>
                <h2 className="mt-1.5 font-display text-2xl leading-snug text-navy">
                  {article.title}
                </h2>
              </div>
              <button
                onClick={() => setArticle(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {reading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3.5 rounded bg-navy/10"
                      style={{ width: `${70 + ((i * 7) % 30)}%` }}
                    />
                  ))}
                </div>
              ) : failed ? (
                <p className="text-sm leading-relaxed text-navy/60">
                  No se pudo cargar el artículo acá (el medio lo bloquea o
                  requiere suscripción). Podés abrirlo en la fuente.
                </p>
              ) : (
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-navy/80">
                  {content}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-navy/10 px-6 py-4 text-right">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-4 py-2 text-sm font-medium text-navy/70 transition-colors hover:border-gold/40 hover:text-navy"
              >
                Abrir en la fuente
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
