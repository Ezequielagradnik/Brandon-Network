"use client";

import { useEffect } from "react";

// Registra actividad del usuario al abrir el dashboard.
export default function SeenPing() {
  useEffect(() => {
    fetch("/api/seen", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
