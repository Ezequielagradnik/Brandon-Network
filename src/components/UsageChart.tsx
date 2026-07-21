"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";

type Bucket = { dayStart: number; count: number };
type UserOpt = { userId: string; name: string };

export default function UsageChart({
  initialBuckets,
  title,
  subtitle,
  todayLabel,
}: {
  initialBuckets: Bucket[];
  title: string;
  subtitle: string;
  todayLabel: string;
}) {
  const { lang } = useLang();
  const locale = lang === "en" ? "en-US" : lang === "pt" ? "pt-BR" : "es-AR";

  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  // Lista de usuarios que chatearon (para el filtro)
  useEffect(() => {
    fetch("/api/support/inbox", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) =>
        setUsers(
          (d.conversations ?? []).map((c: { userId: string; name: string }) => ({
            userId: c.userId,
            name: c.name,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  function onSelect(userId: string) {
    setSelected(userId);
    setLoading(true);
    const qs = userId ? `?userId=${userId}` : "";
    fetch(`/api/support/activity${qs}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { buckets: initialBuckets }))
      .then((d) => setBuckets(d.buckets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const todayCount = buckets[buckets.length - 1]?.count ?? 0;
  const fmtDay = (ms: number) =>
    new Date(ms).toLocaleDateString(locale, { day: "numeric", month: "numeric" });

  return (
    <div className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-navy">{title}</h3>
          <p className="text-xs text-navy/45">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-sm text-navy focus:border-gold/50 focus:outline-none"
          >
            <option value="">{lang === "en" ? "All users" : lang === "pt" ? "Todos os usuários" : "Todos los usuarios"}</option>
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name}
              </option>
            ))}
          </select>
          <div className="text-right">
            <p className="tabular font-display text-3xl leading-none text-navy">
              {todayCount}
            </p>
            <p className="mt-1 text-xs text-navy/45">{todayLabel}</p>
          </div>
        </div>
      </div>

      <div className={`mt-6 transition-opacity ${loading ? "opacity-40" : ""}`}>
        <div className="flex h-36 items-end gap-1.5">
          {buckets.map((b, i) => (
            <div
              key={i}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${fmtDay(b.dayStart)}: ${b.count}`}
            >
              <span className="absolute inset-x-0 top-0 text-center text-[10px] font-medium text-navy/50 opacity-0 transition-opacity group-hover:opacity-100">
                {b.count}
              </span>
              <div
                className="w-full rounded-t bg-gold/70 transition-colors group-hover:bg-gold"
                style={{
                  height: `${(b.count / max) * 100}%`,
                  minHeight: 3,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {buckets.map((b, i) => (
            <span
              key={i}
              className="tabular flex-1 text-center text-[10px] text-navy/40"
            >
              {fmtDay(b.dayStart)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
