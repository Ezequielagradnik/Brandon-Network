import Image from "next/image";
import Link from "next/link";
import LandingHeader from "@/components/LandingHeader";
import HeroGlow from "@/components/HeroGlow";
import MarketTicker from "@/components/MarketTicker";
import Reveal from "@/components/Reveal";

const FEATURES = [
  {
    title: "Noticias",
    desc: "El mercado financiero curado, con índices y análisis pensados para tu patrimonio.",
    icon: <IconNews />,
  },
  {
    title: "IRS",
    desc: "Estado fiscal y formularios por cliente: W-8BEN, 1042-S, 8821 y transcripts, en un solo lugar.",
    icon: <IconIrs />,
  },
  {
    title: "Videos",
    desc: "Análisis y contenido educativo del equipo, disponible cuando lo necesites.",
    icon: <IconVideo />,
  },
];

const STATS = [
  { k: "+60", v: "años asesorando patrimonios" },
  { k: "Coral Gables", v: "Miami, Estados Unidos" },
  { k: "Protección", v: "patrimonial e internacional" },
];

export default function Landing() {
  return (
    <div className="grain min-h-screen overflow-x-hidden bg-navy text-ivory">
      <LandingHeader />

      {/* Hero */}
      <section className="group relative overflow-hidden">
        {/* aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="aurora-1 absolute -top-40 left-1/2 h-[34rem] w-[34rem] rounded-full opacity-[0.10] blur-3xl"
            style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
          />
          <div
            className="aurora-2 absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full opacity-[0.07] blur-3xl"
            style={{ background: "radial-gradient(circle, #2e5a8f, transparent 70%)" }}
          />
        </div>
        <HeroGlow />

        <div className="relative mx-auto max-w-3xl px-8 pb-24 pt-24 text-center sm:pt-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Brandon Brokerage Latam
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-7 font-display text-5xl leading-[1.02] sm:text-7xl">
              Preservando tu{" "}
              <span className="italic text-gold-soft">legado</span>.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-text-muted">
              La plataforma privada de Brandon Network. Mercado, estado fiscal y
              análisis, reunidos para las familias, emprendedores y fundaciones
              que asesoramos hace más de seis décadas.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="group/btn inline-flex items-center gap-2 rounded-full bg-ivory px-7 py-3.5 text-sm font-medium text-navy shadow-[0_0_0_0_rgba(194,161,91,0)] transition-all hover:shadow-[0_0_40px_-6px_rgba(194,161,91,0.5)]"
              >
                Ingresar
                <span className="transition-transform group-hover/btn:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* ticker */}
        <div className="relative">
          <MarketTicker />
        </div>
      </section>

      {/* Features */}
      <section id="plataforma" className="mx-auto max-w-6xl px-8 py-24 scroll-mt-24">
        <Reveal>
          <div className="mx-auto mb-4 h-px w-16 bg-gold/50" />
          <h2 className="text-center font-display text-3xl text-ivory sm:text-4xl">
            Todo tu patrimonio, en un{" "}
            <span className="italic text-gold-soft">lugar</span>.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="group/card relative h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-navy-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40">
                {/* glow interno al hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-[var(--radius-card)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                  style={{
                    background:
                      "radial-gradient(300px circle at 50% 0%, rgba(194,161,91,0.10), transparent 70%)",
                  }}
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gold transition-transform duration-300 group-hover/card:scale-110">
                  {f.icon}
                </span>
                <h3 className="relative mt-6 font-display text-2xl text-ivory">
                  {f.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-text-muted">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Franja de marca */}
      <section id="nosotros" className="scroll-mt-24 border-y border-line bg-navy-2/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-16 text-center sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.v} delay={i * 120}>
              <p className="font-display text-4xl text-gold-soft">{s.k}</p>
              <p className="mt-2 text-sm text-text-muted">{s.v}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="aurora-1 pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-2xl px-8 py-28 text-center">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">
              Tu acceso privado te{" "}
              <span className="italic text-gold-soft">espera</span>.
            </h2>
            <Link
              href="/login"
              className="group/btn mt-10 inline-flex items-center gap-2 rounded-full bg-ivory px-8 py-4 text-sm font-medium text-navy transition-all hover:shadow-[0_0_40px_-6px_rgba(194,161,91,0.5)]"
            >
              Continuar con Google
              <span className="transition-transform group-hover/btn:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-8 py-12 text-center">
          <Image
            src="/brand/brandon-network-white.svg"
            alt="Brandon Network"
            width={120}
            height={50}
            className="h-auto w-28 opacity-80"
          />
          <p className="text-xs text-text-muted/70">
            © {new Date().getFullYear()} Brandon Network · Brandon Brokerage
            Latam · Coral Gables, Miami
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
