export default function Loading() {
  return (
    <div className="flex h-full flex-col px-6 py-6 lg:px-8">
      <div className="grid shrink-0 grid-cols-2 gap-3 pb-5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-2xl border border-navy/10 bg-white px-5 py-4"
          >
            <div className="h-3 w-16 rounded bg-navy/10" />
            <div className="h-6 w-24 rounded bg-navy/10" />
            <div className="h-3 w-12 rounded bg-navy/10" />
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-[72vh] animate-pulse rounded-[var(--radius-card)] border border-navy/10 bg-white lg:h-full"
          >
            <div className="border-b border-navy/10 px-5 py-4">
              <div className="h-6 w-32 rounded bg-navy/10" />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-12 w-full rounded-xl bg-navy/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
