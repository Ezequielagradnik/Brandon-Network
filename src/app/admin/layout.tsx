import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { getT } from "@/lib/lang";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Doble gate: además del middleware, cortamos en el server.
  if (profile?.role !== "admin") redirect("/dashboard/noticias");

  const t = await getT();

  return (
    <div className="min-h-screen bg-ivory text-navy">
      <header className="flex items-center justify-between border-b border-line bg-navy px-8 py-4">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/brandon-network-white.png"
            alt="Brandon Network"
            width={1548}
            height={562}
            className="h-auto w-28"
          />
          <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-gold-soft">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <LanguageSwitcher variant="dark" />
          <Link
            href="/dashboard/noticias"
            className="text-text-muted transition-colors hover:text-ivory"
          >
            ← {t.admin.back}
          </Link>
          <form action={signOut}>
            <button className="text-text-muted transition-colors hover:text-ivory">
              {t.sidebar.logout}
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
