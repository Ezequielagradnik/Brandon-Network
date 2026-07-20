// Esqueleto de las métricas + tabla del panel admin.
// Lo usa el <Suspense> de la página y también el loading.tsx del segmento.
export default function AdminSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-card)] border border-navy/10 bg-white p-5"
          >
            <div className="h-3 w-20 rounded bg-navy/10" />
            <div className="mt-3 h-8 w-16 rounded bg-navy/10" />
          </div>
        ))}
      </div>

      <div className="mt-12 h-7 w-32 rounded bg-navy/10" />

      <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
        <div className="divide-y divide-navy/[0.06]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-40 rounded bg-navy/10" />
              <div className="hidden h-4 w-56 rounded bg-navy/10 sm:block" />
              <div className="ml-auto h-4 w-16 rounded bg-navy/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
