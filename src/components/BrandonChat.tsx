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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Historial
  useEffect(() => {
    fetch("/api/support", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, []);

  // Realtime: mensajes nuevos de esta conversación (incluye respuestas de Brandon)
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
  }, [messages]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setInput("");
    setSending(true);
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
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? d.message : m)));
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
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
      {/* Header */}
      <header className="animate-fade-up flex items-center gap-3 pt-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy font-display text-2xl text-gold">
          B
        </span>
        <div>
          <h1 className="font-display text-3xl leading-tight text-navy sm:text-4xl">
            {t.brandonChat.title}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-navy/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />
            {t.brandonChat.status}
          </p>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="mt-6 flex-1 space-y-3 overflow-y-auto pb-4">
        <div className="mx-auto max-w-md rounded-2xl border border-navy/10 bg-white px-4 py-3 text-center text-sm leading-relaxed text-navy/60">
          {t.brandonChat.greeting}
        </div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
        className="pb-6 pt-2"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-navy/15 bg-white p-2 shadow-[0_8px_30px_-16px_rgba(11,27,46,0.25)] transition-colors focus-within:border-gold/50">
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
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none"
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
        </div>
      </form>
    </div>
  );
}
