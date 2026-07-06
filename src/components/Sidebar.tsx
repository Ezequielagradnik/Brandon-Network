"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { useLang } from "@/components/LangProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type NavItem = {
  href: string;
  key: "noticias";
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { href: "/dashboard/noticias", key: "noticias", icon: <IconNews /> },
];

export type SidebarUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();
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

  // Historial de chats
  type Convo = { id: string; title: string; updated_at: string };
  const [convos, setConvos] = useState<Convo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function renameConv(id: string) {
    const title = editVal.trim();
    setEditingId(null);
    if (!title) return;
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }

  async function doDelete() {
    const id = confirmId;
    setConfirmId(null);
    if (!id) return;
    setConvos((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    try {
      if (localStorage.getItem("bn-active-conv") === id)
        localStorage.removeItem("bn-active-conv");
    } catch {}
    if (window.location.search.includes(`c=${id}`)) router.push("/dashboard");
  }

  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuFor]);

  async function fetchPage(offset: number, append: boolean) {
    try {
      const r = await fetch(`/api/conversations?limit=10&offset=${offset}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const d = await r.json();
      setConvos((prev) => (append ? [...prev, ...d.conversations] : d.conversations));
      setHasMore(d.hasMore);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchPage(0, false);
    const on = () => fetchPage(0, false);
    window.addEventListener("bn-convos-changed", on);
    return () => window.removeEventListener("bn-convos-changed", on);
  }, []);

  function groupConvos() {
    const now = new Date();
    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startYest = startToday - 86400000;
    const start30 = startToday - 30 * 86400000;
    const groups = [
      { key: "today", label: t.sidebar.today, items: [] as Convo[] },
      { key: "yesterday", label: t.sidebar.yesterday, items: [] as Convo[] },
      { key: "last30", label: t.sidebar.last30, items: [] as Convo[] },
      { key: "older", label: t.sidebar.older, items: [] as Convo[] },
    ];
    for (const c of convos) {
      const ts = new Date(c.updated_at).getTime();
      if (ts >= startToday) groups[0].items.push(c);
      else if (ts >= startYest) groups[1].items.push(c);
      else if (ts >= start30) groups[2].items.push(c);
      else groups[3].items.push(c);
    }
    return groups.filter((g) => g.items.length);
  }

  const renderConvo = (c: Convo) =>
    editingId === c.id ? (
      <input
        key={c.id}
        autoFocus
        value={editVal}
        onChange={(e) => setEditVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") renameConv(c.id);
          if (e.key === "Escape") setEditingId(null);
        }}
        onBlur={() => renameConv(c.id)}
        className="w-full rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm text-ivory focus:outline-none"
      />
    ) : (
      <div
        key={c.id}
        className="group/row relative flex items-center rounded-lg pr-1 hover:bg-white/[0.04]"
      >
        <Link href={`/dashboard?c=${c.id}`} className="min-w-0 flex-1 px-3 py-1.5">
          <p className="truncate text-sm text-text-muted">{c.title}</p>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuFor(menuFor === c.id ? null : c.id);
          }}
          aria-label="Opciones"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-ivory group-hover/row:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
        {menuFor === c.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-9 z-20 w-36 overflow-hidden rounded-lg border border-line bg-navy-2 py-1 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]"
          >
            <button
              onClick={() => {
                setEditingId(c.id);
                setEditVal(c.title);
                setMenuFor(null);
              }}
              className="w-full px-3 py-2 text-left text-xs text-text-muted transition-colors hover:bg-white/[0.05] hover:text-ivory"
            >
              {t.sidebar.rename}
            </button>
            <button
              onClick={() => {
                setMenuFor(null);
                setConfirmId(c.id);
              }}
              className="w-full px-3 py-2 text-left text-xs text-down transition-colors hover:bg-white/[0.05]"
            >
              {t.sidebar.delete}
            </button>
          </div>
        )}
      </div>
    );

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
          aria-label={collapsed ? t.sidebar.expand : t.sidebar.collapse}
          title={collapsed ? t.sidebar.expand : t.sidebar.collapse}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted transition-colors hover:bg-white/[0.05] hover:text-ivory ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          <IconChevron open={!collapsed} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-8 flex flex-col gap-1">
        {/* Nuevo chat */}
        <Link
          href="/dashboard"
          onClick={() => {
            try {
              localStorage.removeItem("bn-active-conv");
            } catch {}
          }}
          title={collapsed ? t.sidebar.newChat : undefined}
          className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
            collapsed ? "justify-center px-0" : "px-3"
          } ${
            pathname === "/dashboard"
              ? "bg-white/[0.06] text-ivory"
              : "text-text-muted hover:bg-white/[0.03] hover:text-ivory"
          }`}
        >
          <span className={pathname === "/dashboard" ? "text-gold" : ""}>
            <IconChat />
          </span>
          {!collapsed && t.sidebar.newChat}
        </Link>

        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const label = t.sidebar[item.key];
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
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
              {!collapsed && label}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <Link
            href="/admin"
            title={collapsed ? t.sidebar.admin : undefined}
            className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm transition-all ${
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
            {!collapsed && t.sidebar.admin}
          </Link>
        )}
      </nav>

      {/* Historial de chats (agrupado por fecha) */}
      {!collapsed ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto">
            {groupConvos().map((g) => (
              <div key={g.key}>
                <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted/50">
                  {g.label}
                </p>
                <div className="space-y-0.5">{g.items.map(renderConvo)}</div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => fetchPage(convos.length, true)}
                className="w-full rounded-lg px-3 py-2 text-center text-xs text-text-muted/70 transition-colors hover:text-ivory"
              >
                {t.sidebar.loadMore}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Idioma + Perfil */}
      <div className="mt-6 border-t border-line pt-5">
        {!collapsed && (
          <div className="mb-4 flex justify-center">
            <LanguageSwitcher variant="dark" />
          </div>
        )}

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
            title={collapsed ? t.sidebar.logout : undefined}
            className={`flex w-full items-center gap-2 rounded-lg py-2 text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-ivory ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <IconLogout />
            {!collapsed && t.sidebar.logout}
          </button>
        </form>
      </div>

      {/* Modal confirmar eliminación */}
      {confirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            onClick={() => setConfirmId(null)}
            className="absolute inset-0 bg-[#0b1b2e]/50 backdrop-blur-sm"
          />
          <div className="animate-fade-up relative w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 text-center text-navy shadow-[0_30px_80px_-20px_rgba(11,27,46,0.5)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-down/10 text-down">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </span>
            <h3 className="mt-4 font-display text-xl">{t.sidebar.deleteConfirm}</h3>
            <p className="mt-2 text-sm text-navy/55">{t.sidebar.deleteHint}</p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-navy/15 py-2.5 text-sm font-medium text-navy/70 transition-colors hover:bg-navy/[0.04]"
              >
                {t.sidebar.cancel}
              </button>
              <button
                onClick={doDelete}
                className="flex-1 rounded-xl bg-down py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.sidebar.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* --- iconos --- */
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${open ? "" : "rotate-180"}`}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h7M8.5 14h4" />
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
