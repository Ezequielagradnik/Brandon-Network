"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/LangProvider";

type Msg = {
  id: string;
  sender: "client" | "brandon";
  body: string;
  created_at: string;
};

export default function BrandonChat({ userId }: { userId: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Historial al abrir por primera vez
  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/support", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [open, loaded]);

  // Realtime: escucha mensajes nuevos de esta conversación (incluye respuestas de Brandon)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`support:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setInput("");
    setSending(true);
    // Optimista
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      sender: "client",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (r.ok) {
        const d = await r.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === temp.id ? d.message : m)),
        );
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

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t.brandonChat.open}
          className="animate-fade-up fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-ivory shadow-[0_16px_40px_-12px_rgba(11,27,46,0.55)] transition-transform hover:scale-105"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.6A8.5 8.5 0 1 1 21 11.5z" />
          </svg>
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy bg-[var(--up)]" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="animate-fade-up fixed inset-x-0 bottom-0 z-40 flex h-[70vh] flex-col overflow-hidden border border-line bg-ivory shadow-[0_30px_80px_-20px_rgba(11,27,46,0.5)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-[380px] sm:rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-navy px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-display text-lg text-gold">
                B
              </span>
              <div>
                <p className="font-medium text-ivory">{t.brandonChat.title}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />
                  {t.brandonChat.status}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.brandonChat.close}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/10 hover:text-ivory"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="mx-auto max-w-[85%] rounded-2xl border border-navy/10 bg-white px-4 py-2.5 text-center text-[13px] leading-relaxed text-navy/60">
              {t.brandonChat.greeting}
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.sender === "client"
                      ? "rounded-br-md bg-navy text-ivory"
                      : "rounded-bl-md border border-navy/10 bg-white text-navy"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={`mt-1 text-right text-[10px] ${
                      m.sender === "client" ? "text-ivory/50" : "text-navy/35"
                    }`}
                  >
                    {hhmm(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t border-line bg-white p-3"
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
              placeholder={t.brandonChat.placeholder}
              className="max-h-28 flex-1 resize-none rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={t.brandonChat.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-ivory transition-colors hover:bg-navy-2 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11l5-5 5 5M12 6v13" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
