import type { NewsItem } from "@/lib/mock";

function relativeTime(min: number) {
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
}

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group flex cursor-pointer flex-col rounded-[var(--radius-card)] border border-navy/10 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_8px_30px_-12px_rgba(11,27,46,0.18)]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-navy/70">{item.source}</span>
        <span className="tabular text-navy/45">{relativeTime(item.minutesAgo)}</span>
      </div>
      <h3 className="mt-3 flex-1 text-[15px] font-medium leading-snug text-navy">
        {item.title}
      </h3>
      <div className="mt-4">
        <span className="inline-flex items-center rounded-full border border-navy/10 bg-ivory px-2.5 py-1 text-[11px] font-medium tracking-wide text-navy/60">
          {item.category}
        </span>
      </div>
    </article>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[var(--radius-card)] border border-navy/10 bg-white p-5">
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-navy/10" />
        <div className="h-3 w-12 rounded bg-navy/10" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full rounded bg-navy/10" />
        <div className="h-3.5 w-4/5 rounded bg-navy/10" />
      </div>
      <div className="mt-5 h-5 w-20 rounded-full bg-navy/10" />
    </div>
  );
}
