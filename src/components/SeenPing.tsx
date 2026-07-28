"use client";

import { useEffect } from "react";

// Registra actividad y late cada 45s mientras la pestaña está visible, para
// que el server pueda medir el tiempo activo del usuario en la plataforma.
export default function SeenPing() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/seen", { method: "POST", keepalive: true }).catch(() => {});
    };

    ping();
    const id = setInterval(ping, 45000);
    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
