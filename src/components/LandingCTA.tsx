"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";

export default function LandingCTA() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden bg-navy px-6 py-28 text-center">
      {/* halo dorado */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-2xl"
      >
        <h2 className="font-display text-4xl leading-tight text-ivory sm:text-5xl">
          {t.about.ctaTitle}
        </h2>
        <p className="mt-4 text-base text-text-muted">{t.about.ctaLead}</p>
        <Link
          href="/login"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-medium text-navy shadow-[0_16px_40px_-16px_rgba(194,161,91,0.6)] transition-transform hover:scale-[1.03]"
        >
          {t.about.ctaBtn}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}
