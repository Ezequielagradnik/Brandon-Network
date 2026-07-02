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

  useEffect(() => {
    fetch("/api/news", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

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
            <a
              key={i}
              href={(n as News).link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-[var(--radius-card)] border border-navy/10 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_-12px_rgba(11,27,46,0.18)]"
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
            </a>
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
    </div>
  );
}
