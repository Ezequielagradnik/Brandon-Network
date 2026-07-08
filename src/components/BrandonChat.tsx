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

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
      {!empty && (
        <header className="animate-fade-up pt-10">
          <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
            {t.brandonChat.title}{" "}
            <span className="italic text-gold">{t.brandonChat.accent}</span>
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-navy/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />
            {t.brandonChat.status}
          </p>
        </header>
      )}

      {/* Mensajes */}
      <div ref={scrollRef} className="mt-6 flex-1 space-y-5 overflow-y-auto pb-4">
        {empty && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-navy/10 bg-white text-gold shadow-[0_12px_32px_-18px_rgba(11,27,46,0.35)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <div>
              <p className="font-display text-3xl text-navy sm:text-4xl">
                {t.brandonChat.title}{" "}
                <span className="italic text-gold">{t.brandonChat.accent}</span>
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-navy/50">
                {t.brandonChat.greeting}
              </p>
            </div>
          </div>
        )}
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
