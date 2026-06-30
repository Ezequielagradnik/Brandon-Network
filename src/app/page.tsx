import Image from "next/image";
import Link from "next/link";
import LandingHeader from "@/components/LandingHeader";
import Reveal from "@/components/Reveal";
import ScrollProgress from "@/components/ScrollProgress";

const PILLARS = [
  {
    title: "Mercados que te importan",
    desc: "Las noticias financieras que realmente afectan tu patrimonio, curadas y al día. Sin ruido.",
    icon: <IconNews />,
  },
  {
    title: "Tu situación fiscal, siempre en orden",
    desc: "Tus formularios y estado ante el IRS (W-8BEN, 1042-S, transcripts) a la vista y al día, con el respaldo del equipo de Brandon.",
    icon: <IconIrs />,
  },
  {
    title: "El criterio de Brandon, en video",
    desc: "Análisis y explicaciones claras sobre planificación patrimonial y herencia, cuando los necesites.",
    icon: <IconVideo />,
  },
];

const STEPS = [
  { n: "01", t: "Ingresás con tu cuenta de Google.", d: "Acceso seguro, sin contraseñas que recordar." },
  { n: "02", t: "Ves tu patrimonio, tus noticias y tu estado fiscal en un solo lugar.", d: "Todo reunido, claro y al día." },
  { n: "03", t: "Entendés cada decisión con el acompañamiento de Brandon.", d: "El criterio de quienes lo cuidan hace seis décadas." },
];

const AUDIENCE = [
  { t: "Familias", d: "que quieren preservar su legado." },
  { t: "Emprendedores", d: "que blindan lo que construyeron." },
  { t: "Fundaciones", d: "que planifican a largo plazo." },
];

export default function Landing() {
  return (
    <div className="grain min-h-screen overflow-x-hidden bg-navy text-ivory">
      <ScrollProgress />
      <LandingHeader />

      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="aurora-1 absolute -top-48 left-1/2 h-[36rem] w-[36rem] rounded-full opacity-[0.08] blur-3xl"
            style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-8 pb-24 pt-36 text-center sm:pt-44">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Brandon Network
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto mt-7 max-w-2xl font-display text-5xl leading-[1.05] sm:text-6xl">
              Lo que construiste, protegido y a la{" "}
              <span className="italic shimmer-gold">vista</span>.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-text-muted">
              Brandon Network reúne en un solo lugar privado las noticias que
              mueven tu patrimonio, tu situación fiscal ante el IRS y el criterio
              de quienes lo cuidan hace más de 60 años.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="group/btn inline-flex items-center gap-2 rounded-full bg-ivory px-7 py-3.5 text-sm font-medium text-navy transition-all hover:shadow-[0_0_40px_-6px_rgba(194,161,91,0.5)]"
              >
                Acceder
                <span className="transition-transform group-hover/btn:translate-x-1">→</span>
              </Link>
              <a
                href="#adentro"
                className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-ivory transition-all hover:border-gold/50 hover:bg-white/[0.04]"
              >
                Conocé la plataforma
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Franja de confianza */}
      <section className="border-y border-line/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-x-10 gap-y-3 px-8 py-6 text-center text-sm text-text-muted sm:flex-row">
          <span>60 años de trayectoria</span>
          <span className="hidden h-1 w-1 rounded-full bg-gold/50 sm:block" />
          <span>Coral Gables, Miami</span>
          <span className="hidden h-1 w-1 rounded-full bg-gold/50 sm:block" />
          <span>Familias, empresas y fundaciones de toda Latinoamérica</span>
        </div>
      </section>

      {/* 3. Lo que vas a encontrar adentro */}
      <section id="adentro" className="scroll-mt-24 border-t border-line bg-navy-2/30">
        <div className="mx-auto max-w-6xl px-8 py-24">
          <Reveal>
            <h2 className="max-w-xl font-display text-3xl leading-tight sm:text-4xl">
              Lo que vas a encontrar{" "}
              <span className="italic shimmer-gold">adentro</span>.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 120} className="h-full">
                <div className="flex h-full flex-col bg-navy-2 p-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gold">
                    {p.icon}
                  </span>
                  <h3 className="mt-6 font-display text-2xl leading-snug text-ivory">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Cómo funciona */}
      <section id="funciona" className="mx-auto max-w-5xl scroll-mt-24 px-8 py-24">
        <Reveal>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            Cómo <span className="italic shimmer-gold">funciona</span>.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <p className="tabular font-display text-3xl text-gold/60">{s.n}</p>
              <div className="mt-4 h-px w-full bg-line" />
              <p className="mt-4 text-base font-medium leading-snug text-ivory">
                {s.t}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Para quién */}
      <section className="mx-auto max-w-5xl px-8 py-24">
        <Reveal>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            Para <span className="italic shimmer-gold">quién</span>.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {AUDIENCE.map((a, i) => (
            <Reveal key={a.t} delay={i * 100}>
              <div className="rounded-[var(--radius-card)] border border-line bg-navy-2 p-7">
                <h3 className="font-display text-2xl text-ivory">{a.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {a.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 8. Discreción y seguridad */}
      <section className="border-t border-line bg-navy-2/30">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-8 py-20 text-center">
          <Reveal>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gold">
              <IconShield />
            </span>
            <h2 className="mt-6 font-display text-3xl leading-snug sm:text-4xl">
              Privado, como debe{" "}
              <span className="italic shimmer-gold">ser</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-muted">
              Tu información patrimonial es privada y se trata como tal. Acceso
              seguro, datos protegidos, nada de ruido público.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 9. CTA final */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="aurora-1 pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-2xl px-8 py-28 text-center">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">
              Ordená hoy lo que tu familia va a agradecer{" "}
              <span className="italic shimmer-gold">mañana</span>.
            </h2>
            <Link
              href="/login"
              className="group/btn mt-10 inline-flex items-center gap-2 rounded-full bg-ivory px-8 py-4 text-sm font-medium text-navy transition-all hover:shadow-[0_0_40px_-6px_rgba(194,161,91,0.5)]"
            >
              Acceder a Brandon Network
              <span className="transition-transform group-hover/btn:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-8 py-14 text-center">
          <Image
            src="/brand/brandon-network-white.png"
            alt="Brandon Network"
            width={1548}
            height={562}
            className="h-auto w-32 opacity-80"
          />
          <p className="max-w-md text-sm text-text-muted">
            Brandon Brokerage Latam · Coral Gables, Miami, Estados Unidos
          </p>
          <p className="text-xs text-text-muted/60">
            © {new Date().getFullYear()} Brandon Network. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function IconNews() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h13v14H4z" />
      <path d="M17 8h3v9a2 2 0 0 1-2 2" />
      <path d="M7 9h7M7 13h7M7 16h4" />
    </svg>
  );
}
function IconIrs() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M13 3v6h6" />
      <path d="M10 13h6M10 17h6" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
