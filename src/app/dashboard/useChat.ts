"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { exportChatToPdf } from "@/lib/exportChat";

export type Msg = { role: "user" | "assistant"; content: string };

// Toda la lógica del asistente: estado, carga de conversación, streaming,
// créditos, saludo, export a PDF y envío por email. La página solo pinta.
export function useChat() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const cid = params.get("c");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [emailState, setEmailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailTo, setEmailTo] = useState("");
  const [name, setName] = useState("");
  const [salute, setSalute] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(cid);
  const skipLoad = useRef(false);
  const startedPending = useRef(false);

  useEffect(() => {
    convIdRef.current = cid;
    if (cid) localStorage.setItem("bn-active-conv", cid);
  }, [cid]);

  // Cargar conversación al cambiar ?c=
  useEffect(() => {
    if (skipLoad.current) {
      skipLoad.current = false;
      return;
    }
    setFollowups([]);
    if (!cid) {
      setMessages([]);
      return;
    }
    let cancel = false;
    fetch(`/api/conversations/${cid}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancel)
          setMessages(
            (d.messages || []).map((m: Msg) => ({ role: m.role, content: m.content })),
          );
      })
      .catch(() => {
        if (!cancel) setMessages([]);
      });
    return () => {
      cancel = true;
    };
  }, [cid]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Saludo según la hora (en el cliente para no romper la hidratación)
  useEffect(() => {
    const h = new Date().getHours();
    setSalute(
      h >= 6 && h < 12
        ? t.asistente.goodMorning
        : h < 20
          ? t.asistente.goodAfternoon
          : t.asistente.goodEvening,
    );
  }, [t]);

  // Créditos
  useEffect(() => {
    fetch("/api/credits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setCredits(d.credits);
        setUnlimited(!!d.unlimited);
        if (d.name) setName(d.name);
      })
      .catch(() => {});
  }, []);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;

    // Sin créditos: feedback inmediato, sin llamar a la API (los admins no se capan)
    if (!unlimited && credits !== null && credits < 50) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: clean },
        { role: "assistant", content: `⚠️ ${t.asistente.noCredits}` },
      ]);
      setInput("");
      return;
    }
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);
    setFollowups([]);

    // Asegurar conversación
    let convId = convIdRef.current;
    if (!convId) {
      try {
        const r = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: clean.slice(0, 80) }),
        });
        if (r.ok) {
          const d = await r.json();
          convId = d.id;
          convIdRef.current = convId;
          skipLoad.current = true;
          router.replace(`/dashboard?c=${convId}`);
          window.dispatchEvent(new Event("bn-convos-changed"));
        }
      } catch {
        /* seguimos sin persistir */
      }
    }

    // Guardar la pregunta enseguida (para no perderla al navegar)
    if (convId) {
      fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: clean }] }),
      }).catch(() => {});
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (res.status === 402) {
        setCredits(0);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ ${t.asistente.noCredits}`,
          };
          return copy;
        });
        return;
      }
      if (!res.ok || !res.body) throw new Error(await res.text());

      const rem = res.headers.get("X-Credits-Remaining");
      if (rem !== null && rem !== "unlimited") setCredits(parseInt(rem, 10));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }

      if (convId && acc) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "assistant", content: acc }],
          }),
        })
          .then(() => window.dispatchEvent(new Event("bn-convos-changed")))
          .catch(() => {});
      }

      // Sugerencias de seguimiento
      if (acc) {
        fetch("/api/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...next, { role: "assistant", content: acc }],
          }),
        })
          .then((r) => (r.ok ? r.json() : { questions: [] }))
          .then((d) => setFollowups(Array.isArray(d.questions) ? d.questions : []))
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "⚠️ No se pudo obtener respuesta. Revisá que ANTHROPIC_API_KEY esté configurada e intentá de nuevo.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  // Al montar: handoff del prompt pre-login, o reanudar el chat activo
  useEffect(() => {
    if (startedPending.current) return;
    startedPending.current = true;
    const pending = localStorage.getItem("bn-pending-prompt");
    if (pending) {
      localStorage.removeItem("bn-pending-prompt");
      localStorage.removeItem("bn-active-conv");
      send(pending);
      return;
    }
    if (!cid) {
      const active = localStorage.getItem("bn-active-conv");
      if (active) router.replace(`/dashboard?c=${active}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmail() {
    if (emailState === "sending") return;
    setEmailState("sending");
    try {
      const res = await fetch("/api/email-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setEmailTo(d.to || "");
      setEmailState("sent");
      setTimeout(() => setEmailState("idle"), 6000);
    } catch {
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 5000);
    }
  }

  function handleExport() {
    const locale = lang === "en" ? "en-US" : lang === "pt" ? "pt-BR" : "es-419";
    exportChatToPdf(messages, {
      title: t.asistente.exportTitle,
      you: t.asistente.exportYou,
      dateStr: new Date().toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  }

  return {
    messages,
    input,
    setInput,
    loading,
    followups,
    credits,
    unlimited,
    emailState,
    emailTo,
    name,
    salute,
    empty: messages.length === 0,
    scrollRef,
    send,
    handleEmail,
    handleExport,
  };
}
