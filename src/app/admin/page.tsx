import PageHeader from "@/components/PageHeader";
import AdminStats from "@/components/AdminStats";
import { ADMIN_USERS } from "@/lib/mock";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title="Panel de"
        accent="administración"
        subtitle="Métricas de uso y gestión de usuarios de Brandon Network."
      />

      <div className="mt-8">
        <AdminStats />
      </div>

      <h2 className="mt-12 mb-4 font-display text-2xl text-navy">Usuarios</h2>
      <div className="animate-fade-up overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-navy/45">
              <th className="px-6 py-4 font-medium">Usuario</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Rol</th>
              <th className="px-6 py-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_USERS.map((u) => (
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
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy/60">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: u.active ? "var(--up)" : "var(--text-muted)",
                      }}
                    />
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
