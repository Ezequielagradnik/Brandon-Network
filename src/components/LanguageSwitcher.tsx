"use client";

import { LANGS, type Lang } from "@/lib/i18n";
import { useLang } from "@/components/LangProvider";

export default function LanguageSwitcher({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const { lang, setLang } = useLang();

  const border = variant === "dark" ? "border-white/12" : "border-navy/15";
  const idle =
    variant === "dark"
      ? "text-text-muted hover:text-ivory"
      : "text-navy/50 hover:text-navy";
  const activeCls =
    variant === "dark" ? "bg-ivory text-navy" : "bg-navy text-ivory";

  return (
    <div
      className={`flex items-center rounded-full border ${border} p-0.5 text-[11px] font-medium`}
    >
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2 py-1 uppercase tracking-wide transition-colors ${
            lang === l ? activeCls : idle
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
