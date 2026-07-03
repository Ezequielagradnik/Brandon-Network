"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import SuggestionCarousel from "@/components/SuggestionCarousel";

type Msg = { role: "user" | "assistant"; content: string };

export default function AsistentePage() {
  return (
    <Suspense>
      <Assistant />
    </Suspense>
  );
}

function Assistant() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const cid = params.get("c");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(cid);
  const skipLoad = useRef(false);
  const startedPending = useRef(false);

  useEffect(() => {
    convIdRef.current = cid;
  }, [cid]);

  // Cargar conversación al cambiar ?c=
  useEffect(() => {
    if (skipLoad.current) {
      skipLoad.current = false;
      return;
    }
    if (!cid) {
      setMessages([]);
      return;
    }
    let cancel = false;
    fetch(`/api/conversations/${cid}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancel)
          setMessages(
            (d.messages || []).map((m: Msg) => ({ role: m.role, content: m.content })),
          );
      })
      .catch(() => {
        if (!cancel) setMessages([]);
      });
    return () => {
      cancel = true;
    };
  }, [cid]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);

    // Asegurar conversación
    let convId = convIdRef.current;
    if (!convId) {
      try {
        const r = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: clean.slice(0, 80) }),
        });
        if (r.ok) {
          const d = await r.json();
          convId = d.id;
          convIdRef.current = convId;
          skipLoad.current = true;
          router.replace(`/dashboard?c=${convId}`);
          window.dispatchEvent(new Event("bn-convos-changed"));
        }
      } catch {
        /* seguimos sin persistir */
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }

      if (convId && acc) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "user", content: clean },
              { role: "assistant", content: acc },
            ],
          }),
        })
          .then(() => window.dispatchEvent(new Event("bn-convos-changed")))
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "⚠️ No se pudo obtener respuesta. Revisá que ANTHROPIC_API_KEY esté configurada e intentá de nuevo.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  // Handoff: prompt escrito antes de loguearse (solo en chat nuevo)
  useEffect(() => {
    if (startedPending.current) return;
    startedPending.current = true;
    if (cid) return;
    const pending = localStorage.getItem("bn-pending-prompt");
    if (pending) {
      localStorage.removeItem("bn-pending-prompt");
      send(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
      <header className="animate-fade-up pt-10">
        <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
          {t.asistente.title}{" "}
          <span className="italic text-gold">{t.asistente.accent}</span>
        </h1>
        <p className="mt-2 text-sm text-navy/55">{t.asistente.subtitle}</p>
      </header>

      <div ref={scrollRef} className="mt-6 flex-1 space-y-5 overflow-y-auto pb-4">
        {empty && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-navy/10 bg-white text-gold shadow-[0_12px_32px_-18px_rgba(11,27,46,0.35)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
                <path d="M8.5 11h7M8.5 14h4" />
              </svg>
            </span>
            <div>
              <p className="font-display text-3xl text-navy sm:text-4xl">
                {t.asistente.greeting}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-navy/50">
                {t.asistente.subtitle}
              </p>
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-sm leading-relaxed text-ivory">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-navy/10 bg-white px-4 py-3 text-sm leading-relaxed text-navy">
                {m.content || (
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30" />
                  </span>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="pb-4 pt-2"
      >
        {empty && (
          <div className="mb-2 px-1">
            <SuggestionCarousel
              items={t.heroAI.suggestions}
              onSelect={(s) => send(s)}
            />
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-navy/15 bg-white p-2 shadow-[0_8px_30px_-16px_rgba(11,27,46,0.25)] transition-colors focus-within:border-gold/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={t.asistente.placeholder}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t.asistente.send}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-ivory transition-all hover:bg-navy-2 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5M12 6v13" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-navy/35">
          {t.asistente.disclaimer}
        </p>
      </form>
    </div>
  );
}
