import Image from "next/image";
import GoogleButton from "@/components/GoogleButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getT } from "@/lib/lang";

export default async function LoginPage() {
  const t = await getT();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy px-6">
      {/* halo dorado sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
      />

      <div className="absolute right-5 top-5">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="animate-fade-up flex w-full max-w-sm flex-col items-center">
        <Image
          src="/brand/brandon-network-white.png"
          alt="Brandon Network"
          width={1548}
          height={562}
          priority
          className="h-auto w-56"
        />

        <p className="mt-10 text-center text-lg leading-relaxed text-text-muted">
          {t.login.phrasePre}{" "}
          <span className="font-display italic text-ivory">
            {t.login.phraseAccent}
          </span>
          .
        </p>

        <div className="mt-10 w-full">
          <GoogleButton />
        </div>

        <p className="mt-8 max-w-xs text-center text-xs leading-relaxed text-text-muted/70">
          {t.login.note}
        </p>
      </div>

      <footer className="absolute bottom-6 text-[11px] tracking-wide text-text-muted/60">
        Brandon Brokerage Latam · Coral Gables, Miami
      </footer>
    </main>
  );
}
