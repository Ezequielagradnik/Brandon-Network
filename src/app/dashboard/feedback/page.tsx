"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/components/LangProvider";

type Item = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  status: string;
  votes: number;
  voted: boolean;
  author?: string;
};

const STATUS_STYLE: Record<string, string> = {
  nueva: "border-navy/15 bg-navy/[0.04] text-navy/55",
  revision: "border-gold/40 bg-gold/10 text-[#9a7b32]",
  planeada: "border-navy/25 bg-navy/[0.06] text-navy/70",
  progreso: "border-gold/50 bg-gold/15 text-[#9a7b32]",
  hecha: "border-[var(--up)]/40 bg-[var(--up)]/10 text-[var(--up)]",
};
const STATUS_KEYS = ["nueva", "revision", "planeada", "progreso", "hecha"];

export default function FeedbackPage() {
  const { t } = useLang();
  const f = t.feedback;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sort, setSort] = useState<"top" | "new">("top");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  function load() {
    fetch("/api/feedback", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        setItems(d.items ?? []);
        setCanDelete(Boolean(d.canDelete));
        setIsAdmin(Boolean(d.isAdmin));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    fetch("/api/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  function setStatus(id: string, status: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status } : it)),
    );
    fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tt = title.trim();
    if (!tt || sending) return;
    setSending(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tt, description: desc.trim() }),
      });
      if (r.ok) {
        setTitle("");
        setDesc("");
        if (descRef.current) descRef.current.style.height = "auto";
        setToast(true);
        window.setTimeout(() => setToast(false), 2800);
        load();
      }
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  }

  function vote(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, voted: !it.voted, votes: it.votes + (it.voted ? -1 : 1) }
          : it,
      ),
    );
    fetch("/api/feedback/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId: id }),
    }).catch(() => {});
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (it) =>
            it.title.toLowerCase().includes(q) ||
            (it.description ?? "").toLowerCase().includes(q),
        )
      : items;
    return [...filtered].sort((a, b) =>
      sort === "top"
        ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [items, sort, query]);

  function ago(iso: string) {
    const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
    if (s < 60) return f.agoNow;
    const m = Math.floor(s / 60);
    if (m < 60) return f.agoMin.replace("{n}", String(m));
    const h = Math.floor(m / 60);
    if (h < 24) return f.agoH.replace("{n}", String(h));
    return f.agoDay.replace("{n}", String(Math.floor(h / 24)));
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <PageHeader title={f.title} accent={f.titleAccent} subtitle={f.subtitle} />

      {/* Nueva idea */}
      <form
        onSubmit={submit}
        className="animate-fade-up mt-8 space-y-2.5 rounded-[var(--radius-card)] border border-navy/10 bg-white p-4 shadow-[0_8px_30px_-20px_rgba(11,27,46,0.3)]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={f.formTitle}
          className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
        />
        <textarea
          ref={descRef}
          value={desc}
          onChange={(e) => {
            setDesc(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          maxLength={1000}
          rows={2}
          placeholder={f.formDesc}
          className="max-h-48 w-full resize-none overflow-hidden rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
        />
        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={sending}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#C2A15B] to-[#D9C291] px-7 py-2.5 text-sm font-semibold text-navy shadow-[0_12px_30px_-10px_rgba(194,161,91,0.7)] disabled:opacity-60"
          >
            <span className="relative z-10">{sending ? f.sending : f.submit}</span>
            <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
          </motion.button>
        </div>
      </form>

      {/* Buscador */}
      <div className="mt-10 flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 transition-colors focus-within:border-gold/50">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-navy/40">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={f.searchPlaceholder}
          className="flex-1 bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
        />
      </div>

      {/* Pestañas + contador */}
      <div className="mt-4 mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {(["top", "new"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                sort === k
                  ? "bg-navy/[0.06] text-navy"
                  : "text-navy/45 hover:text-navy"
              }`}
            >
              {k === "top" ? f.tabTop : f.tabNew}
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <span className="text-xs text-navy/45">
            {f.count.replace("{n}", String(items.length))}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[var(--radius-card)] border border-navy/10 bg-white"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-navy/15 bg-white/60 px-5 py-8 text-center text-sm text-navy/45">
          {f.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex gap-4 rounded-[var(--radius-card)] border border-navy/10 bg-white p-4 transition-shadow hover:shadow-[0_14px_40px_-24px_rgba(11,27,46,0.4)]"
            >
              <motion.button
                onClick={() => vote(it.id)}
                aria-pressed={it.voted}
                whileTap={{ scale: 0.85 }}
                className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold/40 ${
                  it.voted
                    ? "border-gold bg-gold text-white shadow-[0_8px_20px_-8px_rgba(194,161,91,0.7)]"
                    : "border-navy/15 text-navy/60 hover:border-gold/40 hover:text-navy"
                }`}
              >
                <motion.span
                  key={it.voted ? "on" : "off"}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14 }}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </motion.span>
                <motion.span
                  key={it.votes}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 16 }}
                  className="tabular mt-0.5 text-sm font-semibold"
                >
                  {it.votes}
                </motion.span>
              </motion.button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-navy/40">
                  <span className="font-semibold">#{i + 1}</span>
                  <span>·</span>
                  <span>{ago(it.createdAt)}</span>
                  {isAdmin && it.author && (
                    <>
                      <span>·</span>
                      <span>
                        {f.by} {it.author}
                      </span>
                    </>
                  )}
                  <div className="ml-auto">
                    {isAdmin ? (
                      <select
                        value={it.status}
                        onChange={(e) => setStatus(it.id, e.target.value)}
                        className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-medium outline-none ${STATUS_STYLE[it.status] ?? STATUS_STYLE.nueva}`}
                      >
                        {STATUS_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {(f.statusLabels as Record<string, string>)[k]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      it.status !== "nueva" && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[it.status] ?? STATUS_STYLE.nueva}`}
                        >
                          {(f.statusLabels as Record<string, string>)[it.status] ??
                            it.status}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <p className="mt-1 font-medium text-navy">{it.title}</p>
                {it.description && (
                  <p className="mt-1 text-sm leading-relaxed text-navy/55">
                    {it.description}
                  </p>
                )}
              </div>
              {canDelete && (
                <button
                  onClick={() => remove(it.id)}
                  aria-label={t.common.delete}
                  title={t.common.delete}
                  className="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg text-navy/35 transition-colors hover:bg-down/10 hover:text-down"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Toast épico al enviar */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-gold/30 bg-white px-5 py-3.5 shadow-[0_24px_60px_-18px_rgba(11,27,46,0.45)]"
          >
            {/* halo dorado */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl opacity-70 blur-xl"
              style={{ background: "radial-gradient(circle at 20% 50%, rgba(194,161,91,0.35), transparent 70%)" }}
            />

            {/* badge con check + destellos */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#C2A15B] to-[#D9C291] shadow-[0_8px_20px_-6px_rgba(194,161,91,0.8)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.18, duration: 0.4, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {Array.from({ length: 7 }).map((_, i) => {
                  const angle = (i / 7) * Math.PI * 2;
                  return (
                    <motion.span
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-gold"
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(angle) * 30,
                        y: Math.sin(angle) * 30,
                        scale: [0, 1, 0.3],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ delay: 0.2, duration: 0.75, ease: "easeOut" }}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <p className="font-display text-lg leading-tight text-navy">
                {f.thanks}
              </p>
              <p className="text-xs text-navy/55">{f.thanksSub}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
