export default function AdminStats({
  metrics,
}: {
  metrics: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="animate-fade-up rounded-[var(--radius-card)] border border-navy/10 bg-white p-5"
        >
          <p className="text-xs text-navy/50">{m.label}</p>
          <p className="tabular mt-2 font-display text-4xl text-navy">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
