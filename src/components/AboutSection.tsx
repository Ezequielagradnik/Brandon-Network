"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useLang } from "@/components/LangProvider";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ICONS = [
  <path key="i" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z M8.5 11h7 M8.5 14h4" />,
  <path key="m" d="M4 19h16 M6 16l4-5 3 3 5-7" />,
  <path key="c" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.6A8.5 8.5 0 1 1 21 11.5z" />,
  <path key="p" d="M12 3l8 4v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7z M9.5 12l1.8 1.8L15 10" />,
];

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// Escribe el texto en loop, tipo demo en vivo
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    let hold = 0;
    let holding = false;
    const id = setInterval(() => {
      if (holding) {
        hold++;
        if (hold > 55) {
          holding = false;
          hold = 0;
          i = 0;
          setN(0);
        }
        return;
      }
      i++;
      setN(i);
      if (i >= text.length) holding = true;
    }, 42);
    return () => clearInterval(id);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-navy/50 align-middle" />
    </>
  );
}

function AppPreview() {
  const { t } = useLang();
  const a = t.about;
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="relative"
    >
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(500px circle at 70% 20%, rgba(194,161,91,0.18), transparent 60%)",
        }}
      />
      <div className="relative overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_40px_90px_-40px_rgba(11,27,46,0.5)]">
        {/* barra de navegador */}
        <div className="flex items-center gap-2 border-b border-navy/10 bg-ivory/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-down/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--up)]/60" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-navy/40">
            brandonnetwork.com/dashboard
          </span>
        </div>

        {/* contenido: asistente */}
        <div className="space-y-4 p-6">
          <div>
            <p className="font-display text-xl text-navy">
              Tu asistente de <span className="italic text-gold">IA</span>
            </p>
          </div>

          <div className="flex justify-end">
            <span className="max-w-[85%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-sm leading-relaxed text-ivory">
              {a.demoQ}
            </span>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-navy/80">
            <p>
              <Typewriter text={a.demoA} />
            </p>
            <div className="overflow-hidden rounded-xl border border-navy/10">
              <div className="grid grid-cols-2 bg-navy/[0.04] text-[11px] font-medium text-navy/60">
                <span className="px-3 py-2">Estructura</span>
                <span className="px-3 py-2">Ideal para</span>
              </div>
              <div className="grid grid-cols-2 border-t border-navy/[0.06] text-xs text-navy/70">
                <span className="px-3 py-2">ILIT</span>
                <span className="px-3 py-2">Seguro de vida</span>
              </div>
              <div className="grid grid-cols-2 border-t border-navy/[0.06] text-xs text-navy/70">
                <span className="px-3 py-2">Foreign Trust</span>
                <span className="px-3 py-2">Herencia</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-navy">
              <span>💡</span> Tip Brandon Network
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState<string>(value);

  useEffect(() => {
    const m = value.match(/^(\d+)(\D*)$/);
    if (!m || !inView) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2];
    const controls = animate(0, target, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(`${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div>
      <p ref={ref} className="tabular font-display text-3xl text-navy sm:text-4xl">
        {display}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-navy/45">{label}</p>
    </div>
  );
}

export default function AboutSection() {
  const { t } = useLang();
  const a = t.about;

  return (
    <section className="relative overflow-hidden bg-ivory px-6 py-24 sm:py-32">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
        style={{
          background:
            "conic-gradient(from 0deg, var(--gold), transparent 40%, var(--navy), transparent 80%, var(--gold))",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
            {a.eyebrow}
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-navy sm:text-5xl">
            {a.title} <span className="italic text-gold">{a.titleAccent}</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-navy/60">{a.lead}</p>
        </motion.div>

        {/* Dos columnas: pilares + preview */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-7"
          >
            {a.features.map((f, i) => (
              <motion.div key={i} variants={item} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[i]}
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-xl text-navy">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy/55">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <AppPreview />
          </motion.div>
        </div>

        {/* Franja de confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 border-t border-navy/10 pt-10 text-center"
        >
          {a.stats.map((s, i) => (
            <Stat key={i} value={s.value} label={s.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
