import type { IrsRow } from "@/lib/mock";

const STATUS_STYLES: Record<IrsRow["status"], string> = {
  Vigente: "bg-up/10 text-up border-up/20",
  Pendiente: "bg-gold/10 text-[#9a7b32] border-gold/30",
  Consentido: "bg-navy/[0.06] text-navy/70 border-navy/15",
  "En revisión": "bg-down/10 text-down border-down/20",
};

export type IrsLabels = {
  cols: { client: string; form: string; status: string; updated: string; detail: string };
  status: Record<string, string>;
};

function StatusBadge({
  status,
  label,
}: {
  status: IrsRow["status"];
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function IrsTable({
  rows,
  labels,
}: {
  rows: IrsRow[];
  labels: IrsLabels;
}) {
  return (
    <div className="animate-fade-up overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-navy/45">
            <th className="px-6 py-4 font-medium">{labels.cols.client}</th>
            <th className="px-6 py-4 font-medium">{labels.cols.form}</th>
            <th className="px-6 py-4 font-medium">{labels.cols.status}</th>
            <th className="px-6 py-4 font-medium">{labels.cols.updated}</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="group border-b border-navy/[0.06] transition-colors last:border-0 hover:bg-ivory/60"
            >
              <td className="px-6 py-4 font-medium text-navy">{row.client}</td>
              <td className="tabular px-6 py-4 text-navy/70">{row.form}</td>
              <td className="px-6 py-4">
                <StatusBadge
                  status={row.status}
                  label={labels.status[row.status] ?? row.status}
                />
              </td>
              <td className="tabular px-6 py-4 text-navy/55">{row.updated}</td>
              <td className="px-6 py-4 text-right">
                <span className="text-xs text-navy/30 transition-colors group-hover:text-gold">
                  {labels.cols.detail} →
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
