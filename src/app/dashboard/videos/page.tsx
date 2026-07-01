import PageHeader from "@/components/PageHeader";
import VideoCard from "@/components/VideoCard";
import { VIDEOS } from "@/lib/mock";
import { getT } from "@/lib/lang";

export default async function VideosPage() {
  const t = await getT();

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title={t.videos.title}
        accent={t.videos.accent}
        subtitle={t.videos.subtitle}
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-medium text-navy/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 14l4-7h8l4 7" />
              <path d="M4 14h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            </svg>
            {t.videos.source}
          </span>
        }
      />

      <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
