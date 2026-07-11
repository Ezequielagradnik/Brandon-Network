"use client";

export default function SuggestionCarousel({
  items,
  onSelect,
}: {
  items: readonly string[];
  onSelect: (s: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-0.5">
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
  );
}
