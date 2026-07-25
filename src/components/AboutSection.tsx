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
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function CardShell({
  index,
  icon,
  title,
  desc,
  className = "",
  children,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white p-7 shadow-[0_12px_50px_-28px_rgba(11,27,46,0.4)] ${className}`}
    >
      {/* brillo dorado en hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(194,161,91,0.10), transparent 60%)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition-colors group-hover:bg-gold/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </span>
        <span className="tabular font-display text-2xl text-navy/15">
          0{index}
        </span>
      </div>
      <h3 className="relative mt-5 font-display text-xl text-navy">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-navy/55">{desc}</p>
      {children}
    </motion.div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState<string>(value);

  const m = value.match(/^(\d+)(\D*)$/);

  useEffect(() => {
    if (!m || !inView) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2];
    const controls = animate(0, target, {
      duration: 1.3,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(`${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, m]);

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
  const f = a.features;

  return (
    <section className="relative overflow-hidden bg-ivory px-6 py-24 sm:py-32">
      {/* Aurora animada de fondo */}
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

        {/* Bento */}
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6"
        >
          {/* Asistente (destacada, con mock de chat) */}
          <CardShell
            index={1}
            icon={ICONS[0]}
            title={f[0].title}
            desc={f[0].desc}
            className="lg:col-span-4"
          >
            <div className="relative mt-6 space-y-2 rounded-xl border border-navy/10 bg-ivory/70 p-4">
              <div className="flex justify-end">
                <span className="max-w-[80%] rounded-2xl rounded-br-md bg-navy px-3.5 py-2 text-xs leading-relaxed text-ivory">
                  {a.demoQ}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-navy/70">{a.demoA}</p>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-navy">
                <span>💡</span> Tip Brandon Network
              </span>
            </div>
          </CardShell>

          {/* Mercado (con ticker mock) */}
          <CardShell
            index={2}
            icon={ICONS[1]}
            title={f[1].title}
            desc={f[1].desc}
            className="lg:col-span-2"
          >
            <div className="mt-6 flex items-center justify-between rounded-xl border border-navy/10 bg-ivory/70 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy font-display text-xs text-ivory">
                  A
                </span>
                <div>
                  <p className="text-xs font-semibold text-navy">AAPL</p>
                  <p className="text-[10px] text-navy/45">Apple Inc</p>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-medium text-navy">$212.40</p>
                <p className="tabular text-[11px] font-medium text-[var(--up)]">
                  ▲ 1.20%
                </p>
              </div>
            </div>
          </CardShell>

          {/* Chat con Brandon */}
          <CardShell
            index={3}
            icon={ICONS[2]}
            title={f[2].title}
            desc={f[2].desc}
            className="lg:col-span-3"
          />

          {/* Privacidad */}
          <CardShell
            index={4}
            icon={ICONS[3]}
            title={f[3].title}
            desc={f[3].desc}
            className="lg:col-span-3"
          />
        </motion.div>

        {/* Franja de confianza con números que cuentan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 border-t border-navy/10 pt-10 text-center"
        >
          {a.stats.map((s, i) => (
            <Stat key={i} value={s.value} label={s.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
