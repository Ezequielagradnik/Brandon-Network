import type { VideoItem } from "@/lib/mock";

export default function VideoCard({ item }: { item: VideoItem }) {
  return (
    <article className="group cursor-pointer">
      <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-navy/10">
        {/* placeholder de thumbnail (se reemplaza por el de Drive) */}
        <div
          className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]"
          style={{
            background:
              "linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-navy/10 transition-colors group-hover:bg-navy/0" />

        {/* botón play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory/90 text-navy shadow-lg transition-transform duration-200 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* duración */}
        <span className="tabular absolute bottom-2 right-2 rounded-md bg-navy/80 px-1.5 py-0.5 text-[11px] font-medium text-ivory">
          {item.duration}
        </span>
      </div>

      <h3 className="mt-3 text-[15px] font-medium leading-snug text-navy transition-colors group-hover:text-gold">
        {item.title}
      </h3>
      <p className="mt-1 text-xs text-navy/50">{item.author}</p>
    </article>
  );
}
