"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";

type Convo = { id: string; title: string; updated_at: string };

export default function ChatHistory({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { t } = useLang();

  const [convos, setConvos] = useState<Convo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function renameConv(id: string) {
    const title = editVal.trim();
    setEditingId(null);
    if (!title) return;
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }

  async function doDelete() {
    const id = confirmId;
    setConfirmId(null);
    if (!id) return;
    setConvos((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    try {
      if (localStorage.getItem("bn-active-conv") === id)
        localStorage.removeItem("bn-active-conv");
    } catch {}
    if (window.location.search.includes(`c=${id}`)) router.push("/dashboard");
  }

  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuFor]);

  async function fetchPage(offset: number, append: boolean) {
    try {
      const r = await fetch(`/api/conversations?limit=10&offset=${offset}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const d = await r.json();
      setConvos((prev) => (append ? [...prev, ...d.conversations] : d.conversations));
      setHasMore(d.hasMore);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchPage(0, false);
    const on = () => fetchPage(0, false);
    window.addEventListener("bn-convos-changed", on);
    return () => window.removeEventListener("bn-convos-changed", on);
  }, []);

  function groupConvos() {
    const now = new Date();
    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startYest = startToday - 86400000;
    const start30 = startToday - 30 * 86400000;
    const groups = [
      { key: "today", label: t.sidebar.today, items: [] as Convo[] },
      { key: "yesterday", label: t.sidebar.yesterday, items: [] as Convo[] },
      { key: "last30", label: t.sidebar.last30, items: [] as Convo[] },
      { key: "older", label: t.sidebar.older, items: [] as Convo[] },
    ];
    for (const c of convos) {
      const ts = new Date(c.updated_at).getTime();
      if (ts >= startToday) groups[0].items.push(c);
      else if (ts >= startYest) groups[1].items.push(c);
      else if (ts >= start30) groups[2].items.push(c);
      else groups[3].items.push(c);
    }
    return groups.filter((g) => g.items.length);
  }

  const renderConvo = (c: Convo) =>
    editingId === c.id ? (
      <input
        key={c.id}
        autoFocus
        value={editVal}
        onChange={(e) => setEditVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") renameConv(c.id);
          if (e.key === "Escape") setEditingId(null);
        }}
        onBlur={() => renameConv(c.id)}
        className="w-full rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm text-ivory focus:outline-none"
      />
    ) : (
      <div
        key={c.id}
        className="group/row relative flex items-center rounded-lg pr-1 hover:bg-white/[0.04]"
      >
        <Link href={`/dashboard?c=${c.id}`} className="min-w-0 flex-1 px-3 py-1.5">
          <p className="truncate text-sm text-text-muted">{c.title}</p>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuFor(menuFor === c.id ? null : c.id);
          }}
          aria-label="Opciones"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-ivory group-hover/row:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
        {menuFor === c.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-9 z-20 w-36 overflow-hidden rounded-lg border border-line bg-navy-2 py-1 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
          >
            <button
              onClick={() => {
                setEditingId(c.id);
                setEditVal(c.title);
                setMenuFor(null);
              }}
              className="w-full px-3 py-2 text-left text-xs text-text-muted transition-colors hover:bg-white/[0.05] hover:text-ivory"
            >
              {t.sidebar.rename}
            </button>
            <button
              onClick={() => {
                setMenuFor(null);
                setConfirmId(c.id);
              }}
              className="w-full px-3 py-2 text-left text-xs text-down transition-colors hover:bg-white/[0.05]"
            >
              {t.sidebar.delete}
            </button>
          </div>
        )}
      </div>
    );

  return (
    <>
      {!collapsed ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto">
            {groupConvos().map((g) => (
              <div key={g.key}>
                <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted/50">
                  {g.label}
                </p>
                <div className="space-y-0.5">{g.items.map(renderConvo)}</div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => fetchPage(convos.length, true)}
                className="w-full rounded-lg px-3 py-2 text-center text-xs text-text-muted/70 transition-colors hover:text-ivory"
              >
                {t.sidebar.loadMore}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            onClick={() => setConfirmId(null)}
            className="absolute inset-0 bg-[#0b1b2e]/50 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 text-center text-navy shadow-[0_30px_80px_-20px_rgba(11,27,46,0.5)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-down/10 text-down">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </span>
            <h3 className="mt-4 font-display text-xl">{t.sidebar.deleteConfirm}</h3>
            <p className="mt-2 text-sm text-navy/55">{t.sidebar.deleteHint}</p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-navy/15 py-2.5 text-sm font-medium text-navy/70 transition-colors hover:bg-navy/[0.04]"
              >
                {t.sidebar.cancel}
              </button>
              <button
                onClick={doDelete}
                className="flex-1 rounded-xl bg-down py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.sidebar.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
