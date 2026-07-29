"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import ScrollProgress from "@/components/ScrollProgress";
import { NEWS_STASH_PREFIX } from "@/lib/newsId";
import type { News } from "@/components/ArticleReader";

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

function sentenceGroups(text: string, per = 3): string[] {
  const sentences =
    text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [text];
  const out: string[] = [];
  let buf: string[] = [];
  for (const s of sentences) {
    if (!s) continue;
    buf.push(s);
    if (buf.length >= per) {
      out.push(buf.join(" "));
      buf = [];
    }
  }
  if (buf.length) out.push(buf.join(" "));
  return out.filter(Boolean);
}

// Texto plano -> bloques (párrafos y listas). Si vino todo en un choclo,
// lo cortamos por oraciones en grupos.
function parseBlocks(text: string): Block[] {
  const clean = text.replace(/\r/g, "").trim();
  const lines = clean.split(/\n/);
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: [...list] });
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const li = line.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    if (li) {
      flushPara();
      list.push(li[2].trim());
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  if (blocks.length && blocks.every((b) => b.type === "p") && blocks.length <= 2) {
    const joined = blocks.map((b) => (b.type === "p" ? b.text : "")).join(" ");
    return sentenceGroups(joined).map((text) => ({ type: "p", text }));
  }
  return blocks;
}

export default function ArticlePage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [article, setArticle] = useState<News | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [reading, setReading] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [favErr, setFavErr] = useState(false);

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

  useEffect(() => {
    if (!article) return;
    setContent("");
    setPoints([]);
    setImgErr(false);
    setReading(true);
    let cancel = false;
    fetch(
      `/api/article?url=${encodeURIComponent(article.link)}&lang=${lang}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancel || !d?.ok) return;
        if (d.content) setContent(d.content);
        if (Array.isArray(d.keyPoints)) setPoints(d.keyPoints);
      })
      .catch(() => {})
      .finally(() => !cancel && setReading(false));
    return () => {
      cancel = true;
    };
  }, [article, lang]);

  function ago(unixSec: number) {
    if (!unixSec) return "";
    const min = Math.max(1, Math.round((Date.now() - unixSec * 1000) / 60000));
    if (min < 60) return t.noticias.agoMin.replace("{n}", String(min));
    return t.noticias.agoH.replace("{n}", String(Math.round(min / 60)));
  }

  const readLabel =
    lang === "en" ? "min read" : lang === "pt" ? "min de leitura" : "min de lectura";

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
  const blocks = body ? parseBlocks(body) : [];
  const words = body ? body.trim().split(/\s+/).length : 0;
  const minutes = words ? Math.max(1, Math.round(words / 200)) : 0;

  let host = "";
  try {
    if (article?.link) host = new URL(article.link).hostname.replace(/^www\./, "");
  } catch {
    /* noop */
  }

  return (
    <>
      <ScrollProgress />
      <article className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
        <div className="mb-8">{back}</div>

        {article && (
          <>
            {/* Cabecera */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy/50">
              <span className="inline-flex items-center gap-1.5 font-medium text-navy/70">
                {host && !favErr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                    alt=""
                    width={16}
                    height={16}
                    onError={() => setFavErr(true)}
                    className="h-4 w-4 rounded-sm"
                  />
                )}
                {article.publisher}
              </span>
              <span className="text-navy/25">•</span>
              <span className="tabular">{ago(article.time)}</span>
              {minutes > 0 && (
                <>
                  <span className="text-navy/25">•</span>
                  <span className="tabular">
                    {minutes} {readLabel}
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-3 font-display text-3xl leading-[1.15] text-navy sm:text-[2.6rem]">
              {article.title}
            </h1>

            {/* Imagen */}
            {article.image && !imgErr && (
              <div className="relative mt-7 overflow-hidden rounded-2xl border border-navy/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  onError={() => setImgErr(true)}
                  className="max-h-[440px] w-full bg-navy/5 object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-3 left-4 text-[11px] font-medium text-white/85">
                  {article.publisher}
                </span>
              </div>
            )}

            {/* Puntos clave */}
            {points.length > 0 && (
              <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#9a7b32]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
                  </svg>
                  {t.noticias.companies.keyPoints}
                </div>
                <ul className="mt-3 space-y-2.5">
                  {points.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-snug text-navy/80">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cuerpo */}
            <div className="mt-8">
              {blocks.length ? (
                <div className="space-y-5 text-[17px] leading-[1.8] text-navy/80">
                  {blocks.map((b, i) =>
                    b.type === "ul" ? (
                      <ul key={i} className="space-y-2 pl-1">
                        {b.items.map((it, j) => (
                          <li key={j} className="flex gap-2.5">
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/40" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    ) : i === 0 ? (
                      <p key={i} className="text-[19px] font-medium leading-[1.7] text-navy">
                        {b.text}
                      </p>
                    ) : (
                      <p key={i}>{b.text}</p>
                    ),
                  )}
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

              {reading && blocks.length > 0 && (
                <p className="mt-4 text-xs text-navy/40">Cargando texto completo…</p>
              )}
            </div>

            {/* Pie */}
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-navy/10 pt-6">
              {back}
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-navy-2"
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
    </>
  );
}
