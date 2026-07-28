import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import AdminStats from "@/components/AdminStats";
import AdminSkeleton from "@/components/AdminSkeleton";
import UsageChart from "@/components/UsageChart";
import AssistantActivity, {
  type QA,
  type TopQuestion,
  type PerUserRow,
} from "@/components/AssistantActivity";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT, getLang } from "@/lib/lang";
import type { Dict, Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastAccess: number | null;
  active: boolean;
  credits: number;
};

type Msg = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

type AssistantData = {
  stats: { qToday: number; q30: number; usersToday: number; avgSeconds: number };
  top: TopQuestion[];
  perDay: { dayStart: number; count: number }[];
  today: QA[];
  perUser: PerUserRow[];
};

const DAYS = 14;

const normQ = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").replace(/[¿?¡!.,;:]+$/g, "").trim();

async function loadAdminData() {
  const admin = createAdminClient();

  const chatsSince = new Date();
  chatsSince.setHours(0, 0, 0, 0);
  chatsSince.setDate(chatsSince.getDate() - (DAYS - 1));

  const startToday0 = new Date();
  startToday0.setHours(0, 0, 0, 0);
  const since30 = new Date(Date.now() - 30 * 86400000);
  const today0Ymd = startToday0.toISOString().slice(0, 10);

  const [
    { data: profiles },
    authRes,
    { data: chatMsgs },
    { data: conversations },
    { data: aiMsgs },
    { data: activityRows },
  ] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, role, credits, last_seen_at"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from("support_messages")
      .select("created_at")
      .gte("created_at", chatsSince.toISOString()),
    admin.from("conversations").select("id, user_id"),
    admin
      .from("messages")
      .select("id, conversation_id, role, content, created_at")
      .gte("created_at", since30.toISOString())
      .order("created_at", { ascending: true }),
    admin
      .from("usage_activity")
      .select("user_id, active_seconds")
      .eq("day", today0Ymd),
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
    const login = a?.last_sign_in_at ? Date.parse(a.last_sign_in_at) : null;
    const seen = p.last_seen_at ? Date.parse(p.last_seen_at) : null;
    // "Último acceso" real: la fecha más reciente entre login y actividad
    const lastAccess = Math.max(login ?? 0, seen ?? 0) || null;
    const created = a?.created_at ? Date.parse(a.created_at) : null;

    if (login && login >= startToday.getTime()) loginsToday++;
    if (created && created >= startMonth.getTime()) newThisMonth++;

    rows.push({
      id: p.id,
      name: p.full_name || email.split("@")[0] || "Usuario",
      email,
      role: p.role || "cliente",
      lastAccess,
      active: lastAccess != null && lastAccess >= d30,
      credits: typeof p.credits === "number" ? p.credits : 0,
    });
  }

  rows.sort((a, b) => (b.lastAccess ?? 0) - (a.lastAccess ?? 0));

  const total = rows.length;
  const activeUsers = rows.filter((r) => r.active).length;

  // --- Analítica del asistente (preguntas y respuestas) ---
  const nameByUser = new Map<string, { name: string; email: string }>();
  for (const r of rows) nameByUser.set(r.id, { name: r.name, email: r.email });

  const convUser = new Map<string, string>();
  for (const c of conversations ?? []) convUser.set(c.id, c.user_id);

  const secondsByUser = new Map<string, number>();
  for (const a of activityRows ?? [])
    secondsByUser.set(a.user_id, a.active_seconds ?? 0);

  const todayStart = startToday0.getTime();
  const aiPerDay: { dayStart: number; count: number }[] = [];
  for (let i = 0; i < DAYS; i++)
    aiPerDay.push({ dayStart: chatsSince.getTime() + i * 86400000, count: 0 });

  const topMap = new Map<string, { text: string; count: number }>();
  const perUserAgg = new Map<
    string,
    { today: number; total: number; last: number | null }
  >();
  const convMsgs = new Map<string, Msg[]>();
  let qToday = 0;
  let q30 = 0;
  const usersToday = new Set<string>();

  for (const m of (aiMsgs ?? []) as Msg[]) {
    if (!convMsgs.has(m.conversation_id)) convMsgs.set(m.conversation_id, []);
    convMsgs.get(m.conversation_id)!.push(m);

    if (m.role !== "user") continue;
    const uid = convUser.get(m.conversation_id);
    if (!uid) continue;
    const ts = Date.parse(m.created_at);
    q30++;

    const idx = Math.floor((ts - chatsSince.getTime()) / 86400000);
    if (idx >= 0 && idx < DAYS) aiPerDay[idx].count++;

    const text = (m.content || "").trim();
    const key = normQ(text);
    if (key.length >= 4) {
      const cur = topMap.get(key);
      if (cur) cur.count++;
      else topMap.set(key, { text: text.slice(0, 140), count: 1 });
    }

    const agg = perUserAgg.get(uid) ?? { today: 0, total: 0, last: null };
    agg.total++;
    if (ts >= todayStart) agg.today++;
    agg.last = Math.max(agg.last ?? 0, ts);
    perUserAgg.set(uid, agg);

    if (ts >= todayStart) {
      qToday++;
      usersToday.add(uid);
    }
  }

  // Preguntas de hoy con su respuesta (la primera del asistente que sigue)
  const todayQA: QA[] = [];
  for (const [convId, list] of convMsgs) {
    const uid = convUser.get(convId);
    if (!uid) continue;
    const who = nameByUser.get(uid);
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m.role !== "user") continue;
      const ts = Date.parse(m.created_at);
      if (ts < todayStart) continue;
      let answer: string | null = null;
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].role === "assistant") {
          answer = (list[j].content || "").slice(0, 800);
          break;
        }
        if (list[j].role === "user") break;
      }
      todayQA.push({
        id: m.id,
        user: who?.name ?? "—",
        question: (m.content || "").slice(0, 300),
        answer,
        time: ts,
      });
    }
  }
  todayQA.sort((a, b) => b.time - a.time);

  const top = [...topMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .filter((q) => q.count > 0);

  const perUser: PerUserRow[] = [];
  const userIds = new Set<string>([
    ...perUserAgg.keys(),
    ...secondsByUser.keys(),
  ]);
  for (const uid of userIds) {
    const who = nameByUser.get(uid);
    if (!who) continue;
    const agg = perUserAgg.get(uid);
    perUser.push({
      name: who.name,
      email: who.email,
      today: agg?.today ?? 0,
      total: agg?.total ?? 0,
      seconds: secondsByUser.get(uid) ?? 0,
      last: agg?.last ?? null,
    });
  }
  perUser.sort(
    (a, b) => b.today - a.today || b.total - a.total || b.seconds - a.seconds,
  );

  const activeSecondsList = [...secondsByUser.values()].filter((s) => s > 0);
  const avgSeconds = activeSecondsList.length
    ? Math.round(
        activeSecondsList.reduce((s, v) => s + v, 0) / activeSecondsList.length,
      )
    : 0;

  const assistant: AssistantData = {
    stats: { qToday, q30, usersToday: usersToday.size, avgSeconds },
    top,
    perDay: aiPerDay,
    today: todayQA.slice(0, 60),
    perUser,
  };

  return {
    rows,
    values: [activeUsers, loginsToday, total, newThisMonth],
    buckets,
    assistant,
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
  const { rows, values, buckets, assistant } = await loadAdminData();

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
                  {fmtLast(u.lastAccess)}
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

      <AssistantActivity
        stats={assistant.stats}
        top={assistant.top}
        perDay={assistant.perDay}
        today={assistant.today}
        perUser={assistant.perUser}
        locale={locale}
        l={t.admin.assistant}
      />
    </>
  );
}
