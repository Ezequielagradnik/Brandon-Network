"use client";

import { useState } from "react";
import type { AssistantData } from "@/lib/adminAssistant";

export type { QA, TopQuestion, PerUserRow } from "@/lib/adminAssistant";

export type AssistantLabels = {
  title: string;
  subtitle: string;
  qToday: string;
  q30: string;
  usersToday: string;
  avgTime: string;
  topTitle: string;
  topEmpty: string;
  perDay: string;
  todayTitle: string;
  todayEmpty: string;
  answer: string;
  noAnswer: string;
  byUser: string;
  colUser: string;
  colToday: string;
  colTotal: string;
  colTime: string;
  colLast: string;
  times: string;
  showMore: string;
  showLess: string;
  filterAll: string;
};

function fmtDuration(sec: number) {
  if (!sec || sec < 60) return `${Math.max(0, Math.round(sec))}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function AssistantActivity({
  initial,
  users,
  locale,
  l,
}: {
  initial: AssistantData;
  users: { id: string; name: string }[];
  locale: string;
  l: AssistantLabels;
}) {
  const [data, setData] = useState<AssistantData>(initial);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [allToday, setAllToday] = useState(false);

  async function selectUser(id: string) {
    setUserId(id);
    setAllToday(false);
    setOpen({});
    if (!id) {
      setData(initial);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/assistant?userId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (r.ok) setData(await r.json());
    } catch {
      /* dejamos los datos actuales */
    } finally {
      setLoading(false);
    }
  }

  const { stats, top, perDay, today, perUser } = data;
  const maxDay = Math.max(1, ...perDay.map((b) => b.count));
  const tiles = [
    { label: l.qToday, value: stats.qToday },
    { label: l.q30, value: stats.q30 },
    { label: l.usersToday, value: stats.usersToday },
    { label: l.avgTime, value: fmtDuration(stats.avgSeconds), raw: true },
  ];

  const shownToday = allToday ? today : today.slice(0, 8);

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (ts: number | null) =>
    ts
      ? new Date(ts).toLocaleDateString(locale, { day: "numeric", month: "short" })
      : "—";

  return (
    <section className="animate-fade-up mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">{l.title}</h2>
          <p className="mt-1 text-sm text-navy/50">{l.subtitle}</p>
        </div>
        {users.length > 0 && (
          <select
            value={userId}
            onChange={(e) => selectUser(e.target.value)}
            className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy/70 outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            <option value="">{l.filterAll}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
        {/* Stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((tt) => (
            <div
              key={tt.label}
              className="rounded-[var(--radius-card)] border border-navy/10 bg-white px-5 py-4"
            >
              <div className="text-xs uppercase tracking-wide text-navy/45">
                {tt.label}
              </div>
              <div className="tabular mt-1.5 font-display text-2xl text-navy">
                {tt.raw ? String(tt.value) : Number(tt.value).toLocaleString(locale)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Preguntas más frecuentes */}
          <div className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
            <h3 className="text-sm font-medium text-navy/70">{l.topTitle}</h3>
            {top.length === 0 ? (
              <p className="mt-4 text-sm text-navy/45">{l.topEmpty}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {top.map((q, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="tabular mt-0.5 text-xs font-semibold text-gold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm leading-snug text-navy/80">
                      {q.text}
                    </span>
                    <span className="tabular shrink-0 rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-medium text-navy/55">
                      {q.count} {l.times}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Preguntas por día */}
          <div className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
            <h3 className="text-sm font-medium text-navy/70">{l.perDay}</h3>
            <div className="mt-6 flex h-44 items-stretch gap-1.5 border-b border-navy/10">
              {perDay.map((b, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                >
                  {b.count > 0 && (
                    <span className="tabular text-[10px] font-medium text-navy/55">
                      {b.count}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t bg-navy/80 transition-all"
                    style={{
                      height: `${(b.count / maxDay) * 100}%`,
                      minHeight: b.count ? 6 : 0,
                    }}
                    title={`${b.count}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {perDay.map((b, i) => (
                <span
                  key={i}
                  className="tabular flex-1 text-center text-[9px] text-navy/35"
                >
                  {new Date(b.dayStart).toLocaleDateString(locale, { day: "numeric" })}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Preguntas de hoy con su respuesta */}
        <div className="mt-6 rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
          <h3 className="text-sm font-medium text-navy/70">{l.todayTitle}</h3>
          {today.length === 0 ? (
            <p className="mt-4 text-sm text-navy/45">{l.todayEmpty}</p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-navy/[0.06]">
                {shownToday.map((qa) => {
                  const isOpen = !!open[qa.id];
                  const ans = qa.answer ?? "";
                  const long = ans.length > 260;
                  return (
                    <li key={qa.id} className="py-4 first:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-navy/55">
                          {qa.user}
                        </span>
                        <span className="tabular text-xs text-navy/35">
                          {fmtTime(qa.time)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-navy">
                        {qa.question}
                      </p>
                      <div className="mt-2 rounded-lg bg-ivory/70 px-3 py-2.5">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-navy/40">
                          {l.answer}
                        </div>
                        {ans ? (
                          <p className="text-sm leading-relaxed text-navy/70">
                            {long && !isOpen ? ans.slice(0, 260) + "…" : ans}
                            {long && (
                              <button
                                onClick={() =>
                                  setOpen((o) => ({ ...o, [qa.id]: !isOpen }))
                                }
                                className="ml-1.5 text-xs font-medium text-gold hover:underline"
                              >
                                {isOpen ? l.showLess : l.showMore}
                              </button>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm italic text-navy/40">{l.noAnswer}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {today.length > 8 && (
                <button
                  onClick={() => setAllToday((v) => !v)}
                  className="mt-4 text-sm font-medium text-navy/60 hover:text-navy"
                >
                  {allToday ? l.showLess : `${l.showMore} (${today.length - 8})`}
                </button>
              )}
            </>
          )}
        </div>

        {/* Por usuario */}
        <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
          <div className="border-b border-navy/10 px-5 py-3 text-sm font-medium text-navy/70">
            {l.byUser}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-navy/45">
                <th className="px-5 py-3 font-medium">{l.colUser}</th>
                <th className="px-5 py-3 font-medium">{l.colToday}</th>
                <th className="px-5 py-3 font-medium">{l.colTotal}</th>
                <th className="px-5 py-3 font-medium">{l.colTime}</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">
                  {l.colLast}
                </th>
              </tr>
            </thead>
            <tbody>
              {perUser.map((u) => (
                <tr
                  key={u.email}
                  className="border-b border-navy/[0.06] last:border-0 hover:bg-ivory/60"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-navy">{u.name}</div>
                    <div className="text-xs text-navy/45">{u.email}</div>
                  </td>
                  <td className="tabular px-5 py-3 font-medium text-navy/80">
                    {u.today}
                  </td>
                  <td className="tabular px-5 py-3 text-navy/60">{u.total}</td>
                  <td className="tabular px-5 py-3 text-navy/60">
                    {fmtDuration(u.seconds)}
                  </td>
                  <td className="tabular hidden px-5 py-3 text-navy/55 md:table-cell">
                    {fmtDate(u.last)}
                  </td>
                </tr>
              ))}
              {perUser.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-navy/50">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
