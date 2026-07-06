"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingHeader() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#adentro", label: t.nav.platform },
    { href: "#funciona", label: t.nav.how },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:pt-5">
      <nav
        className={`pointer-events-auto mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-full border py-2.5 pl-5 pr-2.5 transition-all duration-300 ${
          scrolled
            ? "border-white/12 bg-navy-2/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            : "border-white/10 bg-navy-2/55 backdrop-blur-lg"
        }`}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/brandon-network-white.png"
            alt="Brandon Network"
            width={1548}
            height={562}
            priority
            className="h-auto w-28"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-muted transition-colors hover:text-ivory"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSwitcher variant="dark" />

          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2.5 text-sm font-medium text-navy transition-all hover:shadow-[0_0_30px_-6px_rgba(194,161,91,0.6)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21a7 7 0 0 1 14 0" />
            </svg>
            {t.nav.access}
          </Link>
        </div>
      </nav>
    </div>
  );
}
