"use client";

import { useEffect, useState } from "react";

export type News = {
  title: string;
  publisher: string;
  link: string;
  time: number;
};

export default function ArticleReader({
  article,
  onClose,
  ago,
}: {
  article: News | null;
  onClose: () => void;
  ago: (t: number) => string;
}) {
  const [content, setContent] = useState("");
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!article) return;
    setContent("");
    setFailed(false);
    setReading(true);
    let cancel = false;
    fetch(`/api/article?url=${encodeURIComponent(article.link)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        if (d?.ok && d.content) setContent(d.content);
        else setFailed(true);
      })
      .catch(() => !cancel && setFailed(true))
      .finally(() => !cancel && setReading(false));
    return () => {
      cancel = true;
    };
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-[#0b1b2e]/50 backdrop-blur-sm"
      />
      <div className="animate-fade-up relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_30px_80px_-20px_rgba(11,27,46,0.5)]">
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
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

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
              No se pudo cargar el artículo acá (el medio lo bloquea o requiere
              suscripción). Podés abrirlo en la fuente.
            </p>
          ) : (
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-navy/80">
              {content}
            </div>
          )}
        </div>

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
  );
}
