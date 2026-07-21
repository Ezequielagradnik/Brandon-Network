import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import AdminStats from "@/components/AdminStats";
import AdminSkeleton from "@/components/AdminSkeleton";
import UsageChart from "@/components/UsageChart";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT, getLang } from "@/lib/lang";
import type { Dict, Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastSignIn: number | null;
  active: boolean;
  credits: number;
};

const DAYS = 14;

async function loadAdminData() {
  const admin = createAdminClient();

  const chatsSince = new Date();
  chatsSince.setHours(0, 0, 0, 0);
  chatsSince.setDate(chatsSince.getDate() - (DAYS - 1));

  const [{ data: profiles }, authRes, { data: chatMsgs }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, credits"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from("support_messages")
      .select("created_at")
      .gte("created_at", chatsSince.toISOString()),
  ]);

  // Mensajes por día (últimos DAYS días)
  const buckets: { dayStart: number; count: number }[] = [];
  for (let i = 0; i < DAYS; i++) {
    buckets.push({ dayStart: chatsSince.getTime() + i * 86400000, count: 0 });
  }
  for (const m of chatMsgs ?? []) {
    const ts = Date.parse(m.created_at);
    const idx = Math.floor((ts - chatsSince.getTime()) / 86400000);
    if (idx >= 0 && idx < DAYS) buckets[idx].count++;
  }

  const authMap = new Map<
    string,
    { email?: string; created_at?: string; last_sign_in_at?: string }
  >();
  for (const u of authRes.data?.users ?? []) {
    authMap.set(u.id, {
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    });
  }

  const d30 = Date.now() - 30 * 86400000;
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startMonth = new Date();
  startMonth.setDate(1);
  startMonth.setHours(0, 0, 0, 0);

  const rows: Row[] = [];
  let loginsToday = 0;
  let newThisMonth = 0;

  for (const p of profiles ?? []) {
    const a = authMap.get(p.id);
    const email = p.email || a?.email || "";
    const last = a?.last_sign_in_at ? Date.parse(a.last_sign_in_at) : null;
    const created = a?.created_at ? Date.parse(a.created_at) : null;

    if (last && last >= startToday.getTime()) loginsToday++;
    if (created && created >= startMonth.getTime()) newThisMonth++;

    rows.push({
      id: p.id,
      name: p.full_name || email.split("@")[0] || "Usuario",
      email,
      role: p.role || "cliente",
      lastSignIn: last,
      active: last != null && last >= d30,
      credits: typeof p.credits === "number" ? p.credits : 0,
    });
  }

  rows.sort((a, b) => (b.lastSignIn ?? 0) - (a.lastSignIn ?? 0));

  const total = rows.length;
  const activeUsers = rows.filter((r) => r.active).length;

  return {
    rows,
    values: [activeUsers, loginsToday, total, newThisMonth],
    buckets,
  };
}

export default async function AdminPage() {
  const [t, lang] = await Promise.all([getT(), getLang()]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title={t.admin.title}
        accent={t.admin.accent}
        subtitle={t.admin.subtitle}
      />

      <Suspense fallback={<AdminSkeleton />}>
        <AdminData t={t} lang={lang} />
      </Suspense>
    </div>
  );
}

async function AdminData({ t, lang }: { t: Dict; lang: Lang }) {
  const locale = lang === "en" ? "en-US" : lang === "pt" ? "pt-BR" : "es-AR";
  const { rows, values, buckets } = await loadAdminData();

  const metrics = values.map((v, i) => ({
    label: t.admin.metrics[i] ?? "",
    value: v.toLocaleString(locale),
  }));


  const fmtLast = (ts: number | null) =>
    ts
      ? new Date(ts).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : t.admin.never;

  return (
    <>
      <div className="mt-8">
        <AdminStats metrics={metrics} />
      </div>

      <div className="mt-6">
        <UsageChart
          initialBuckets={buckets}
          title={t.admin.activityTitle}
          subtitle={t.admin.chatsPerDay + " · " + t.admin.last14}
          todayLabel={t.admin.chatsToday}
        />
      </div>

      <h2 className="mt-12 mb-4 font-display text-2xl text-navy">
        {t.admin.usersTitle}
      </h2>
      <div className="animate-fade-up overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-navy/45">
              <th className="px-6 py-4 font-medium">{t.admin.cols.user}</th>
              <th className="px-6 py-4 font-medium">{t.admin.cols.email}</th>
              <th className="px-6 py-4 font-medium">{t.admin.cols.role}</th>
              <th className="px-6 py-4 font-medium">{t.admin.cols.credits}</th>
              <th className="hidden px-6 py-4 font-medium md:table-cell">
                {t.admin.cols.lastLogin}
              </th>
              <th className="px-6 py-4 font-medium">{t.admin.cols.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-b border-navy/[0.06] transition-colors last:border-0 hover:bg-ivory/60"
              >
                <td className="px-6 py-4 font-medium text-navy">{u.name}</td>
                <td className="px-6 py-4 text-navy/60">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.role === "admin"
                        ? "border-gold/30 bg-gold/10 text-[#9a7b32]"
                        : "border-navy/15 bg-navy/[0.06] text-navy/60"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`tabular text-sm font-medium ${
                      u.credits < 50 ? "text-down" : "text-navy/70"
                    }`}
                  >
                    {u.credits}
                  </span>
                  <span className="text-xs text-navy/35"> / 500</span>
                </td>
                <td className="tabular hidden px-6 py-4 text-navy/55 md:table-cell">
                  {fmtLast(u.lastSignIn)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy/60">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: u.active ? "var(--up)" : "var(--text-muted)",
                      }}
                    />
                    {u.active ? t.admin.active : t.admin.inactive}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-navy/50">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
