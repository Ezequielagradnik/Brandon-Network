"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
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

      {/* Selector de idioma + acceso */}
      <header className="absolute right-0 top-0 z-10 flex items-center gap-3 p-4">
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((open) => !open)}
            className="flex h-12 items-center gap-2 rounded-lg border bg-white/20 px-4 text-[14px] font-medium backdrop-blur-sm transition-colors hover:bg-white/40"
            style={{ color: NAVY, borderColor: NAVY }}
          >
            <span className="text-[18px] leading-none">{current.flag}</span>
            {current.label}
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
          className="flex h-12 items-center justify-center rounded-lg px-6 text-center text-[14px] font-semibold tracking-wide text-white shadow-[0_10px_30px_-10px_rgba(20,34,74,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgba(20,34,74,0.8)]"
          style={{ background: `linear-gradient(180deg, #2a3f7a 0%, ${NAVY} 100%)` }}
        >
          {t.nav.access}
        </Link>
      </header>

      {/* Logo */}
      <div className="relative flex justify-center pt-6">
        <Image
          src="/brand/brandon-network-navy.png"
          alt="Brandon Network"
          width={1548}
          height={562}
          priority
          className="h-14 w-auto sm:h-16"
        />
      </div>

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
        <form className="group relative mt-10 w-full max-w-3xl">
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
    </section>
  );
}
