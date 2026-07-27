"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/components/LangProvider";

type Item = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  votes: number;
  voted: boolean;
};

export default function FeedbackPage() {
  const { t } = useLang();
  const f = t.feedback;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [sort, setSort] = useState<"top" | "new">("top");
  const descRef = useRef<HTMLTextAreaElement>(null);

  function load() {
    fetch("/api/feedback", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        setItems(d.items ?? []);
        setCanDelete(Boolean(d.canDelete));
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

  const visible = useMemo(
    () =>
      [...items].sort((a, b) =>
        sort === "top"
          ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      ),
    [items, sort],
  );

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

      {/* Pestañas + contador */}
      <div className="mt-10 mb-4 flex items-center justify-between">
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
      ) : items.length === 0 ? (
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
                <div className="flex items-center gap-2 text-[11px] text-navy/40">
                  <span className="font-semibold">#{i + 1}</span>
                  <span>·</span>
                  <span>{ago(it.createdAt)}</span>
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
    </div>
  );
}
