"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/LangProvider";

type Conversation = {
  userId: string;
  name: string;
  email: string;
  lastBody: string;
  lastAt: string;
  lastSender: string;
  pending: number;
};
type Msg = {
  id: string;
  sender: "client" | "brandon";
  body: string;
  created_at: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminChatsPage() {
  const { t } = useLang();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selected?.userId ?? null;
  }, [selected]);

  function loadConvos() {
    fetch("/api/support/inbox", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) => setConvos(d.conversations ?? []))
      .catch(() => {});
  }

  function openConvo(c: Conversation) {
    setSelected(c);
    setThread([]);
    fetch(`/api/support/inbox?userId=${c.userId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setThread(d.messages ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    loadConvos();
  }, []);

  // Realtime: cualquier mensaje nuevo actualiza la lista y, si es del hilo abierto, lo agrega
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("support:admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        (payload) => {
          const m = payload.new as Msg & { user_id: string };
          loadConvos();
          if (m.user_id === selectedRef.current) {
            setThread((prev) =>
              prev.some((x) => x.id === m.id) ? prev : [...prev, m],
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread]);

  async function send() {
    const body = input.trim();
    if (!body || sending || !selected) return;
    setInput("");
    setSending(true);
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      sender: "brandon",
      body,
      created_at: new Date().toISOString(),
    };
    setThread((prev) => [...prev, temp]);
    try {
      const r = await fetch("/api/support/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.userId, body }),
      });
      if (r.ok) {
        const d = await r.json();
        setThread((prev) => prev.map((x) => (x.id === temp.id ? d.message : x)));
        loadConvos();
      }
    } catch {
      /* queda el optimista */
    } finally {
      setSending(false);
    }
  }

  function hhmm(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? convos.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q),
        )
      : convos;
    // Sin responder primero; dentro de cada grupo, por más reciente
    return [...base].sort((a, b) => {
      const ap = a.pending > 0 ? 0 : 1;
      const bp = b.pending > 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return b.lastAt.localeCompare(a.lastAt);
    });
  }, [convos, query]);

  const pendingTotal = useMemo(
    () => convos.filter((c) => c.pending > 0).length,
    [convos],
  );

  return (
    <div className="flex h-full">
      {/* Lista de conversaciones */}
      <aside
        className={`${
          selected ? "hidden md:flex" : "flex"
        } w-full flex-col border-r border-navy/10 bg-white md:w-80`}
      >
        <div className="border-b border-navy/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-navy">{t.bandeja.title}</h1>
            {pendingTotal > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--up)] px-1.5 text-[11px] font-semibold text-white">
                {pendingTotal}
              </span>
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.bandeja.search}
            className="mt-3 w-full rounded-lg border border-navy/15 bg-ivory/50 px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-navy/50">
              {t.bandeja.empty}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.userId}
                onClick={() => openConvo(c)}
                className={`flex w-full items-center gap-3 border-b border-navy/[0.05] px-4 py-3 text-left transition-colors hover:bg-ivory/60 ${
                  selected?.userId === c.userId
                    ? "bg-ivory"
                    : c.pending > 0
                      ? "bg-[var(--up)]/[0.06]"
                      : ""
                }`}
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm text-gold">
                  {initials(c.name)}
                  {c.pending > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--up)]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm text-navy ${
                        c.pending > 0 ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {c.name}
                    </p>
                    <span
                      className={`tabular shrink-0 text-[11px] ${
                        c.pending > 0
                          ? "font-medium text-[var(--up)]"
                          : "text-navy/40"
                      }`}
                    >
                      {hhmm(c.lastAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs ${
                        c.pending > 0 ? "text-navy/70" : "text-navy/50"
                      }`}
                    >
                      {c.lastSender === "brandon" ? "Vos: " : ""}
                      {c.lastBody}
                    </p>
                    {c.pending > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--up)] px-1.5 text-[11px] font-semibold text-white">
                        {c.pending}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Hilo */}
      <section
        className={`${
          selected ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-ivory`}
      >
        {!selected ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-navy/45">
            {t.bandeja.pick}
          </div>
        ) : (
          <>
            {/* Header del hilo */}
            <div className="flex items-center gap-3 border-b border-navy/10 bg-white px-5 py-3.5">
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy md:hidden"
                aria-label="Volver"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm text-gold">
                {initials(selected.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{selected.name}</p>
                <p className="truncate text-xs text-navy/50">{selected.email}</p>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-5 py-5">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "brandon" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.sender === "brandon"
                        ? "rounded-br-md bg-navy text-ivory"
                        : "rounded-bl-md border border-navy/10 bg-white text-navy"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        m.sender === "brandon" ? "text-ivory/50" : "text-navy/35"
                      }`}
                    >
                      {hhmm(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Responder */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2 border-t border-navy/10 bg-white p-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={t.bandeja.placeholder}
                className="max-h-28 flex-1 resize-none rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label={t.bandeja.send}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-ivory transition-colors hover:bg-navy-2 disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 11l5-5 5 5M12 6v13" />
                </svg>
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
