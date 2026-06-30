"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/dashboard/noticias", label: "Noticias", icon: <IconNews /> },
  { href: "/dashboard/irs", label: "IRS", icon: <IconIrs /> },
  { href: "/dashboard/videos", label: "Videos", icon: <IconVideo /> },
];

export type SidebarUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-line bg-navy-2 px-5 py-7">
      <Link href="/dashboard/noticias" className="px-2">
        <Image
          src="/brand/brandon-network-white.svg"
          alt="Brandon Network"
          width={160}
          height={66}
          priority
          className="h-auto w-36"
        />
      </Link>

      <nav className="mt-12 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-white/[0.06] text-ivory"
                  : "text-text-muted hover:bg-white/[0.03] hover:text-ivory"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
              )}
              <span className={active ? "text-gold" : "text-text-muted group-hover:text-ivory"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <Link
            href="/admin"
            className={`group mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              pathname.startsWith("/admin")
                ? "bg-white/[0.06] text-ivory"
                : "text-text-muted hover:bg-white/[0.03] hover:text-ivory"
            }`}
          >
            <span className={pathname.startsWith("/admin") ? "text-gold" : ""}>
              <IconAdmin />
            </span>
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex items-center gap-3 px-1">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold-soft ring-1 ring-white/10">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ivory">{user.name}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>
        </div>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-ivory"
          >
            <IconLogout />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

/* --- iconos (line, 18px) --- */
function IconNews() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h13v14H4z" />
      <path d="M17 8h3v9a2 2 0 0 1-2 2" />
      <path d="M7 9h7M7 13h7M7 16h4" />
    </svg>
  );
}
function IconIrs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M13 3v6h6" />
      <path d="M10 13h6M10 17h6" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
