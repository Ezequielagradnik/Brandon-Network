import Image from "next/image";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy px-6">
      {/* halo dorado sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }}
      />

      <div className="animate-fade-up flex w-full max-w-sm flex-col items-center">
        <Image
          src="/brand/brandon-network-white.svg"
          alt="Brandon Network"
          width={220}
          height={90}
          priority
          className="h-auto w-52"
        />

        <p className="mt-10 text-center text-lg leading-relaxed text-text-muted">
          Preservando tu{" "}
          <span className="font-display italic text-ivory">legado</span>.
        </p>

        <div className="mt-10 w-full">
          <GoogleButton />
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-text-muted/70">
          Acceso exclusivo para clientes y administradores
          <br />
          de Brandon Network.
        </p>
      </div>

      <footer className="absolute bottom-6 text-[11px] tracking-wide text-text-muted/60">
        Brandon Brokerage Latam · Coral Gables, Miami
      </footer>
    </main>
  );
}
