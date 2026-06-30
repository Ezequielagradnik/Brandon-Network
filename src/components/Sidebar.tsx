"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("bn-sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("bn-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isAdminActive = pathname.startsWith("/admin");

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-line bg-navy-2 py-7 transition-[width] duration-300 ease-out ${
        collapsed ? "w-[76px] px-3" : "w-64 px-5"
      } ${mounted ? "" : "transition-none"}`}
    >
      {/* Logo / toggle */}
      <div className="flex items-center justify-between px-1">
        {!collapsed && (
          <Link href="/dashboard/noticias" className="px-1">
            <Image
              src="/brand/brandon-network-white.png"
              alt="Brandon Network"
              width={1548}
              height={562}
              priority
              className="h-auto w-32"
            />
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir" : "Colapsar"}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted transition-colors hover:bg-white/[0.05] hover:text-ivory ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          <IconChevron open={!collapsed} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-12 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition-all ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
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
              {!collapsed && item.label}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <Link
            href="/admin"
            title={collapsed ? "Admin" : undefined}
            className={`group mt-2 flex items-center gap-3 rounded-xl py-2.5 text-sm transition-all ${
              collapsed ? "justify-center px-0" : "px-3"
            } ${
              isAdminActive
                ? "bg-white/[0.06] text-ivory"
                : "text-text-muted hover:bg-white/[0.03] hover:text-ivory"
            }`}
          >
            <span className={isAdminActive ? "text-gold" : ""}>
              <IconAdmin />
            </span>
            {!collapsed && "Admin"}
          </Link>
        )}
      </nav>

      {/* Perfil */}
      <div className="mt-6 border-t border-line pt-5">
        <div
          className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-1"}`}
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={36}
              height={36}
              title={collapsed ? user.name : undefined}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <div
              title={collapsed ? user.name : undefined}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold-soft ring-1 ring-white/10"
            >
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ivory">{user.name}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
          )}
        </div>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex w-full items-center gap-2 rounded-lg py-2 text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-ivory ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <IconLogout />
            {!collapsed && "Cerrar sesión"}
          </button>
        </form>
      </div>
    </aside>
  );
}

/* --- iconos (line, 18px) --- */
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
