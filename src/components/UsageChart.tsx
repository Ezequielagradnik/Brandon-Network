// Gráfico de barras simple (sin librerías): mensajes por día.
export default function UsageChart({
  points,
  title,
  subtitle,
  todayLabel,
  todayCount,
}: {
  points: { label: string; count: number }[];
  title: string;
  subtitle: string;
  todayLabel: string;
  todayCount: number;
}) {
  const max = Math.max(1, ...points.map((p) => p.count));

  return (
    <div className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-display text-xl text-navy">{title}</h3>
          <p className="text-xs text-navy/45">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="tabular font-display text-3xl text-navy">{todayCount}</p>
          <p className="text-xs text-navy/45">{todayLabel}</p>
        </div>
      </div>

      <div className="mt-6 flex h-32 items-end gap-1.5">
        {points.map((p, i) => (
          <div
            key={i}
            className="group flex flex-1 flex-col items-center justify-end gap-1.5"
            title={`${p.label}: ${p.count}`}
          >
            <span className="tabular text-[10px] font-medium text-navy/50 opacity-0 transition-opacity group-hover:opacity-100">
              {p.count}
            </span>
            <div
              className="w-full rounded-t bg-gold/70 transition-colors group-hover:bg-gold"
              style={{ height: `${Math.max(3, (p.count / max) * 100)}%` }}
            />
            <span className="tabular text-[10px] text-navy/40">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
