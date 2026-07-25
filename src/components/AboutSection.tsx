"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LangProvider";

const ICONS = [
  // Asistente de IA
  <path key="i" d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z M8.5 11h7 M8.5 14h4" />,
  // Mercado
  <path key="m" d="M4 19h16 M6 16l4-5 3 3 5-7" />,
  // Chat con Brandon
  <path key="c" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.6A8.5 8.5 0 1 1 21 11.5z" />,
  // Privacidad
  <path key="p" d="M12 3l8 4v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7z M9.5 12l1.8 1.8L15 10" />,
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function AboutSection() {
  const { t } = useLang();
  const a = t.about;

  return (
    <section className="relative overflow-hidden bg-ivory px-6 py-24 sm:py-32">
      {/* Blobs decorativos suaves */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--navy), transparent 70%)" }}
        animate={{ y: [0, -28, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
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
            {a.title}{" "}
            <span className="italic text-gold">{a.titleAccent}</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-navy/60">{a.lead}</p>
        </motion.div>

        {/* Pilares */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {a.features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_10px_40px_-24px_rgba(11,27,46,0.3)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition-colors group-hover:bg-gold/15">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[i]}
                </svg>
              </span>
              <h3 className="mt-5 font-display text-xl text-navy">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/55">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Franja de confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-14 gap-y-6 border-t border-navy/10 pt-10 text-center"
        >
          {a.stats.map((s, i) => (
            <div key={i}>
              <p className="font-display text-3xl text-navy sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-navy/45">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
