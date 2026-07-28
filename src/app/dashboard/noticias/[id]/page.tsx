"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { NEWS_STASH_PREFIX } from "@/lib/newsId";
import type { News } from "@/components/ArticleReader";

// Un bloque de texto plano -> párrafos legibles. Si la fuente vino sin saltos
// (un choclo), lo cortamos por oraciones en grupos de a tres.
function toParagraphs(text: string): string[] {
  const clean = text.replace(/\r/g, "").trim();
  let paras = clean
    .split(/\n{2,}/)
    .map((s) => s.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  if (paras.length <= 2) {
    const sentences =
      clean.replace(/\n+/g, " ").match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [clean];
    paras = [];
    let buf: string[] = [];
    for (const s of sentences) {
      const t = s.trim();
      if (!t) continue;
      buf.push(t);
      if (buf.length >= 3) {
        paras.push(buf.join(" "));
        buf = [];
      }
    }
    if (buf.length) paras.push(buf.join(" "));
  }
  return paras.filter(Boolean);
}

export default function ArticlePage() {
  const { t } = useLang();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [article, setArticle] = useState<News | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState("");
  const [reading, setReading] = useState(true);
  const [imgErr, setImgErr] = useState(false);

  // 1) Recuperar la nota que dejó la lista al navegar
  useEffect(() => {
    if (!id) return;
    try {
      const raw = sessionStorage.getItem(NEWS_STASH_PREFIX + id);
      if (raw) setArticle(JSON.parse(raw) as News);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  // 2) Traer el texto completo
  useEffect(() => {
    if (!article) return;
    setContent("");
    setImgErr(false);
    setReading(true);
    let cancel = false;
    fetch(`/api/article?url=${encodeURIComponent(article.link)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancel && d?.ok && d.content) setContent(d.content);
      })
      .catch(() => {})
      .finally(() => !cancel && setReading(false));
    return () => {
      cancel = true;
    };
  }, [article]);

  function ago(unixSec: number) {
    if (!unixSec) return "";
    const min = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (min < 60) return t.noticias.agoMin.replace("{n}", String(min));
    return t.noticias.agoH.replace("{n}", String(Math.round(min / 60)));
  }

  const back = (
    <button
      onClick={() => router.push("/dashboard/noticias")}
      className="inline-flex items-center gap-2 text-sm font-medium text-navy/60 transition-colors hover:text-navy"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {t.noticias.companies.back}
    </button>
  );

  if (notFound) {
    return (
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-start gap-6 px-6 py-10">
        {back}
        <p className="text-navy/60">
          No pudimos abrir esta nota. Volvé a{" "}
          <Link href="/dashboard/noticias" className="text-navy underline">
            Noticias
          </Link>{" "}
          y elegila de nuevo.
        </p>
      </div>
    );
  }

  const body = content || article?.summary || "";
  const paragraphs = body ? toParagraphs(body) : [];

  return (
    <article className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
      <div className="mb-6">{back}</div>

      {article && (
        <>
          <div className="flex items-center gap-2 text-xs text-navy/50">
            <span className="font-medium text-navy/70">{article.publisher}</span>
            <span>·</span>
            <span className="tabular">{ago(article.time)}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight text-navy sm:text-4xl">
            {article.title}
          </h1>

          {article.image && !imgErr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image}
              alt={article.title}
              onError={() => setImgErr(true)}
              className="mt-6 max-h-[420px] w-full rounded-2xl bg-navy/5 object-cover"
            />
          )}

          <div className="mt-7">
            {paragraphs.length ? (
              <div className="space-y-5 text-[17px] leading-[1.8] text-navy/80">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : reading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-navy/10"
                    style={{ width: `${68 + ((i * 9) % 32)}%` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-navy/60">
                No se pudo cargar el texto de esta nota. Podés abrirla en la
                fuente original.
              </p>
            )}

            {reading && paragraphs.length > 0 && (
              <p className="mt-4 text-xs text-navy/40">Cargando texto completo…</p>
            )}
          </div>

          <div className="mt-10 border-t border-navy/10 pt-6">
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
        </>
      )}
    </article>
  );
}
