import AdminSkeleton from "@/components/AdminSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="animate-pulse">
        <div className="h-10 w-72 max-w-full rounded bg-navy/10" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-navy/10" />
      </div>
      <AdminSkeleton />
    </div>
  );
}
