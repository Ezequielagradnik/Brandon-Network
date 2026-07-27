"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { useLang } from "@/components/LangProvider";

type Item = {
  id: string;
  title: string;
  description: string | null;
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

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    fetch("/api/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

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
        load();
      }
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  }

  function vote(id: string) {
    // Optimista
    setItems((prev) =>
      [...prev]
        .map((it) =>
          it.id === id
            ? {
                ...it,
                voted: !it.voted,
                votes: it.votes + (it.voted ? -1 : 1),
              }
            : it,
        )
        .sort((a, b) => b.votes - a.votes),
    );
    fetch("/api/feedback/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId: id }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <PageHeader title={f.title} accent={f.titleAccent} subtitle={f.subtitle} />

      {/* Nueva idea */}
      <form
        onSubmit={submit}
        className="animate-fade-up mt-8 space-y-3 rounded-[var(--radius-card)] border border-navy/10 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(11,27,46,0.3)]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={f.formTitle}
          className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder={f.formDesc}
          className="w-full resize-none rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || !title.trim()}
            className="rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-navy-2 disabled:opacity-40"
          >
            {sending ? f.sending : f.submit}
          </button>
        </div>
      </form>

      {/* Lista */}
      <h2 className="mt-10 mb-4 font-display text-2xl text-navy">{f.listTitle}</h2>

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
          {items.map((it) => (
            <div
              key={it.id}
              className="flex gap-4 rounded-[var(--radius-card)] border border-navy/10 bg-white p-4"
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
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill={it.voted ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </motion.span>
                <span className="tabular mt-0.5 text-sm font-semibold">
                  {it.votes}
                </span>
              </motion.button>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy">{it.title}</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
