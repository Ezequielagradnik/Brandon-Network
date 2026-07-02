"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { type Lang } from "@/lib/i18n";

const NAVY = "#14224a";

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

export default function Hero() {
  const { lang, setLang, t } = useLang();
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signInGoogle() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/noticias`,
      },
    });
    if (error) {
      setBusy(false);
      console.error(error);
    }
  }

  const words = t.heroAI.words;
  const prompts = t.heroAI.prompts;
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setWordVisible(true);
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((i) => (i + 1) % prompts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prompts.length]);

  // Cierra el modal con Esc
  useEffect(() => {
    if (!gateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gateOpen]);

  // Evita índices fuera de rango al cambiar idioma
  const word = words[wordIndex % words.length];
  const prompt = prompts[promptIndex % prompts.length];

  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* Fondo océano estilizado (centro blanco, mar alrededor) */}
      <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden bg-white">
        {/* base: blanco al centro -> océano en los bordes */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 95% at 50% 40%, #ffffff 0%, #ffffff 19%, #e2f6f8 30%, #a7e0e8 44%, #63bcd6 58%, #2f96bd 72%, #17739e 85%, #0d5478 100%)",
          }}
        />
        {/* anillos concéntricos = ondas */}
        <div
          className="ocean-ripple absolute inset-0"
          style={{
            background:
              "repeating-radial-gradient(125% 95% at 50% 40%, transparent 0 42px, rgba(255,255,255,0.35) 42px 44px)",
          }}
        />
        <div
          className="ocean-ripple absolute inset-0"
          style={{
            animationDelay: "-4.5s",
            background:
              "repeating-radial-gradient(125% 95% at 50% 40%, transparent 0 84px, rgba(13,84,120,0.18) 84px 86px)",
          }}
        />
        {/* brillo horizontal suave */}
        <div
          className="ocean-sheen absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 30% at 50% 30%, rgba(255,255,255,0.7), transparent 70%)",
          }}
        />
        {/* profundidad en los bordes inferiores */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(100% 75% at 50% 125%, rgba(9,60,92,0.55), transparent 60%)",
          }}
        />
      </div>

      {/* Imagen 3D del océano (cuando exista el archivo, cubre el fondo CSS) */}
      <Image
        src="/brand/hero-bg-ocean.png"
        alt=""
        fill
        priority
        className="-z-10 object-cover"
      />

      {/* Top bar responsive: logo a la izquierda, controles a la derecha */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Image
          src="/brand/brandon-network-navy.png"
          alt="Brandon Network"
          width={1548}
          height={562}
          priority
          className="h-9 w-auto shrink-0 sm:h-12"
        />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((open) => !open)}
            className="flex h-11 items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 text-[14px] font-medium shadow-[0_8px_24px_-14px_rgba(20,34,74,0.5)] backdrop-blur-md transition-all hover:bg-white sm:h-12 sm:px-4"
            style={{ color: NAVY }}
          >
            <span className="text-[18px] leading-none">{current.flag}</span>
            <span className="hidden sm:inline">{current.label}</span>
            <span
              className="text-[11px] transition-transform"
              style={{ transform: langOpen ? "rotate(180deg)" : "none" }}
            >
              ▾
            </span>
          </button>
          {langOpen && (
            <ul
              role="listbox"
              className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-white/60 bg-white/85 shadow-[0_16px_40px_-16px_rgba(20,34,74,0.45)] backdrop-blur-xl"
            >
              {LANGUAGES.map((option) => (
                <li key={option.code} role="option" aria-selected={option.code === lang}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(option.code);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-white"
                    style={{ color: NAVY }}
                  >
                    <span className="text-[18px] leading-none">{option.flag}</span>
                    {option.label}
                    {option.code === lang && (
                      <span className="ml-auto text-[12px]">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-center text-[14px] font-semibold tracking-wide shadow-[0_14px_34px_-12px_rgba(20,34,74,0.55)] ring-1 ring-[#14224a]/10 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-12px_rgba(20,34,74,0.7)] sm:h-12 sm:px-6"
          style={{ color: NAVY }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
          </svg>
          {t.nav.access}
        </Link>
        </div>
      </header>

      {/* Copy */}
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-[24vh] text-center">
        <h1
          style={{ fontFamily: "var(--font-fraunces)", color: NAVY }}
          className="text-[38px] font-normal leading-[1.15] sm:text-[52px] lg:text-[60px]"
        >
          {t.heroAI.line1}
          <br />
          {t.heroAI.forWord}{" "}
          <span
            className="italic transition-opacity duration-300"
            style={{ opacity: wordVisible ? 1 : 0 }}
          >
            {word}
          </span>
        </h1>

        <p
          className="mt-6 max-w-2xl text-balance text-[16px] leading-relaxed sm:text-[18px]"
          style={{ color: `${NAVY}b3` }}
        >
          {t.heroAI.sub}
        </p>

        {/* Prompter glass */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setGateOpen(true);
          }}
          className="group relative mt-10 w-full max-w-3xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[1.5px] rounded-[18px] bg-gradient-to-br from-white/90 via-white/30 to-white/70"
          />
          <div className="relative flex items-center gap-4 rounded-2xl border border-white/60 bg-white/35 py-4 pl-5 pr-4 shadow-[0_20px_60px_-20px_rgba(20,34,74,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-colors focus-within:bg-white/45">
            <input
              type="text"
              placeholder={prompt}
              className="min-h-[72px] flex-1 bg-transparent text-[19px] focus:outline-none sm:min-h-[88px] sm:text-[20px]"
              style={{ color: NAVY }}
            />
            <span className="relative shrink-0">
              <span
                aria-hidden
                className="absolute -inset-1.5 animate-pulse rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 opacity-70 blur-md"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className="relative flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-[0_8px_24px_-8px_rgba(20,34,74,0.7)] transition-transform hover:scale-[1.06] active:scale-[0.97]"
                style={{ background: `linear-gradient(180deg, #2a3f7a 0%, ${NAVY} 100%)` }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </span>
          </div>
        </form>
      </div>

      {/* Modal: iniciar sesión para usar el asistente */}
      {gateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            aria-label="Cerrar"
            onClick={() => setGateOpen(false)}
            className="absolute inset-0 bg-[#0b1b2e]/40 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-md rounded-2xl border border-white/60 bg-white p-8 text-center shadow-[0_30px_80px_-20px_rgba(20,34,74,0.5)]">
            <button
              aria-label="Cerrar"
              onClick={() => setGateOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#14224a]/50 transition-colors hover:bg-[#14224a]/5 hover:text-[#14224a]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(20,34,74,0.08)", color: NAVY }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>

            <h2
              className="mt-5 text-[24px] leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", color: NAVY }}
            >
              {t.heroAI.gate.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: `${NAVY}b3` }}>
              {t.heroAI.gate.body}
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              {/* Login con Google (real) */}
              <button
                onClick={signInGoogle}
                disabled={busy}
                className="flex h-12 items-center justify-center gap-2.5 rounded-xl text-[14px] font-semibold text-white shadow-[0_14px_34px_-12px_rgba(20,34,74,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: `linear-gradient(180deg, #2a3f7a 0%, ${NAVY} 100%)` }}
              >
                <GoogleIcon />
                {busy ? t.login.connecting : t.login.google}
              </button>

              {/* Registrarse (también vía Google) */}
              <div className="flex items-center justify-center gap-1.5 text-[13px]">
                <span style={{ color: `${NAVY}99` }}>{t.heroAI.gate.noAccount}</span>
                <button
                  onClick={signInGoogle}
                  disabled={busy}
                  className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-60"
                  style={{ color: NAVY }}
                >
                  {t.heroAI.gate.register}
                </button>
              </div>

              <button
                onClick={() => setGateOpen(false)}
                className="mt-1 h-10 text-[13px] font-medium transition-colors"
                style={{ color: `${NAVY}99` }}
              >
                {t.heroAI.gate.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true" className="rounded-full bg-white p-[1px]">
      <path fill="#FFC107" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#FF3D00" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#4CAF50" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#1976D2" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
