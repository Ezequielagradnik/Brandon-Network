export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="animate-pulse">
        {/* Título */}
        <div className="h-10 w-64 max-w-full rounded bg-navy/10" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-navy/10" />

        {/* Índices */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-navy/10 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 bg-white px-5 py-4">
              <div className="h-3 w-16 rounded bg-navy/10" />
              <div className="h-4 w-20 rounded bg-navy/10" />
            </div>
          ))}
        </div>

        {/* Buscador de empresas */}
        <div className="mt-12 h-7 w-72 max-w-full rounded bg-navy/10" />
        <div className="mt-4 h-12 w-full max-w-xl rounded-[var(--radius-card)] bg-navy/10" />

        {/* Tabla */}
        <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
          <div className="divide-y divide-navy/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-4 w-16 rounded bg-navy/10" />
                <div className="h-4 w-48 rounded bg-navy/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
