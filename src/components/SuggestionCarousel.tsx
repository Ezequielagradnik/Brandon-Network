"use client";

import { useEffect, useRef, useState } from "react";

export default function SuggestionCarousel({
  items,
  onSelect,
}: {
  items: readonly string[];
  onSelect: (s: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  const arrow =
    "absolute top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-[0_4px_12px_-4px_rgba(11,27,46,0.4)] transition hover:bg-ivory sm:flex";

  return (
    <div className="relative">
      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Anterior"
          className={`${arrow} -left-1`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}

      <div
        ref={ref}
        className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-0.5"
      >
        {items.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className="shrink-0 whitespace-nowrap rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-medium text-navy/70 transition-colors hover:border-gold/40 hover:text-navy"
          >
            {s}
          </button>
        ))}
      </div>

      {canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Siguiente"
          className={`${arrow} -right-1`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
