"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";

// Menú de tres puntitos para editar/eliminar un mensaje.
export default function MessageActions({
  onEdit,
  onDelete,
  align = "right",
}: {
  onEdit: () => void;
  onDelete: () => void;
  align?: "left" | "right";
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative self-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="⋯"
        className="flex h-7 w-7 items-center justify-center rounded-full text-navy/40 opacity-0 transition-opacity hover:bg-navy/5 hover:text-navy group-hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute top-8 z-20 w-32 overflow-hidden rounded-lg border border-navy/10 bg-white py-1 shadow-[0_12px_30px_-10px_rgba(11,27,46,0.35)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-2 text-left text-xs text-navy/70 transition-colors hover:bg-navy/[0.04] hover:text-navy"
          >
            {t.common.edit}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-left text-xs text-down transition-colors hover:bg-navy/[0.04]"
          >
            {t.common.delete}
          </button>
        </div>
      )}
    </div>
  );
}
