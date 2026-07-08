"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/components/LangProvider";

// Widget "Advanced Chart" de TradingView. Embebible, gratis y sin API key.
export default function TradingViewChart({ symbol }: { symbol: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !symbol) return;

    host.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    host.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: lang === "pt" ? "br" : lang === "en" ? "en" : "es",
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      backgroundColor: "#ffffff",
      gridColor: "rgba(11,27,46,0.05)",
      support_host: "https://www.tradingview.com",
    });
    host.appendChild(script);

    return () => {
      host.innerHTML = "";
    };
  }, [symbol, lang]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-navy/10 bg-white">
      <div
        ref={ref}
        className="tradingview-widget-container"
        style={{ height: 420, width: "100%" }}
      />
    </div>
  );
}
