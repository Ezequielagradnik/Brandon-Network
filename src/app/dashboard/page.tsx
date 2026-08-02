"use client";

import { Suspense } from "react";
import { useLang } from "@/components/LangProvider";
import SuggestionCarousel from "@/components/SuggestionCarousel";
import Markdown from "@/components/Markdown";
import { useChat } from "@/app/dashboard/useChat";

export default function AsistentePage() {
  return (
    <Suspense>
      <Assistant />
    </Suspense>
  );
}

function Assistant() {
  const { t } = useLang();
  const {
    messages,
    input,
    setInput,
    loading,
    followups,
    credits,
    unlimited,
    emailState,
    emailTo,
    name,
    salute,
    empty,
    scrollRef,
    send,
    handleEmail,
    handleExport,
  } = useChat();

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
      {!empty && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-6">
          {emailState === "sent" && (
            <span className="text-xs font-medium text-up">
              ✓ {t.asistente.emailSent.replace("{email}", emailTo)}
            </span>
          )}
          {emailState === "error" && (
            <span className="text-xs font-medium text-down">
              {t.asistente.emailError}
            </span>
          )}
          <button
            onClick={handleEmail}
            disabled={emailState === "sending"}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-navy/70 shadow-[0_4px_16px_-8px_rgba(11,27,46,0.3)] transition-colors hover:border-gold/50 hover:text-navy disabled:opacity-50"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
            {emailState === "sending"
              ? t.asistente.emailSending
              : t.asistente.emailSend}
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-navy/70 shadow-[0_4px_16px_-8px_rgba(11,27,46,0.3)] transition-colors hover:border-gold/50 hover:text-navy"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
            </svg>
            {t.asistente.exportPdf}
          </button>
        </div>
      )}
      {!empty && (
        <header className="animate-fade-up pt-4">
          <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
            {t.asistente.title}{" "}
            <span className="italic text-gold">{t.asistente.accent}</span>
          </h1>
          <p className="mt-2 text-sm text-navy/55">{t.asistente.subtitle}</p>
        </header>
      )}

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
                {salute ? (name ? `${salute}, ${name}` : salute) : t.asistente.greeting}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-navy/50">
                {salute ? t.asistente.greeting : t.asistente.subtitle}
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
            <div key={i} className="w-full">
              {m.content ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <span className="inline-flex gap-1 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/30" />
                </span>
              )}
            </div>
          ),
        )}

        {!loading && followups.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {followups.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-left text-[13px] text-navy/70 transition-colors hover:border-gold/50 hover:text-navy"
              >
                {q}
              </button>
            ))}
          </div>
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
            disabled={
              loading ||
              !input.trim() ||
              (!unlimited && credits !== null && credits < 50)
            }
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
          {unlimited ? (
            <>
              {" · "}
              <span className="text-navy/45">{t.asistente.creditsUnlimited}</span>
            </>
          ) : (
            credits !== null && (
              <>
                {" · "}
                <span className={credits < 50 ? "font-medium text-down" : "text-navy/45"}>
                  {t.asistente.creditsLeft.replace("{n}", String(credits))}
                </span>
              </>
            )
          )}
        </p>
      </form>
    </div>
  );
}
