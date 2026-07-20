export default function Loading() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-6">
      <div className="animate-pulse pt-10">
        <div className="h-10 w-56 max-w-full rounded bg-navy/10" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-navy/10" />
      </div>

      <div className="mt-6 flex-1 space-y-5">
        <div className="mx-auto h-14 w-80 max-w-full animate-pulse rounded-2xl bg-navy/10" />
      </div>

      <div className="animate-pulse pb-6 pt-2">
        <div className="h-14 w-full rounded-2xl bg-navy/10" />
      </div>
    </div>
  );
}
