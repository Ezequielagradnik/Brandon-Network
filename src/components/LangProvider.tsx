"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { dict, type Dict, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({
  initial,
  children,
}: {
  initial: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();

  function setLang(l: Lang) {
    setLangState(l);
    document.cookie = `bn-lang=${l}; path=/; max-age=31536000; samesite=lax`;
    // Re-render de los server components con el nuevo idioma
    router.refresh();
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de LangProvider");
  return ctx;
}
