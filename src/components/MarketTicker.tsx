import { MARKET_INDICES } from "@/lib/mock";

export default function MarketTicker() {
  // duplicado para loop continuo
  const items = [...MARKET_INDICES, ...MARKET_INDICES, ...MARKET_INDICES];

  return (
    <div className="marquee-mask overflow-hidden border-y border-line/60 bg-navy-2/30 py-3">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {items.map((idx, i) => {
          const up = idx.changePct >= 0;
          return (
            <span key={i} className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">{idx.label}</span>
              <span className="tabular text-ivory">{idx.value}</span>
              <span
                className="tabular text-xs font-medium"
                style={{ color: up ? "var(--up)" : "var(--down)" }}
              >
                {up ? "▲" : "▼"} {Math.abs(idx.changePct).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
