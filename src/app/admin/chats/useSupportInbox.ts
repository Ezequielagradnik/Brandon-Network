"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Conversation = {
  userId: string;
  name: string;
  email: string;
  lastBody: string;
  lastAt: string;
  lastSender: string;
  pending: number;
};

export type Msg = {
  id: string;
  sender: "client" | "brandon";
  body: string;
  created_at: string;
};

// Bandeja de soporte del admin: lista de conversaciones, hilo abierto,
// realtime de Supabase, y las acciones (responder, editar, borrar).
export function useSupportInbox() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selected?.userId ?? null;
  }, [selected]);

  function loadConvos() {
    fetch("/api/support/inbox", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) => setConvos(d.conversations ?? []))
      .catch(() => {});
  }

  function openConvo(c: Conversation) {
    setSelected(c);
    setThread([]);
    fetch(`/api/support/inbox?userId=${c.userId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setThread(d.messages ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    loadConvos();
  }, []);

  // Realtime: cualquier mensaje nuevo actualiza la lista y, si es del hilo abierto, lo agrega
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("support:admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        (payload) => {
          loadConvos();
          const row = (payload.new ?? payload.old) as Msg & { user_id?: string };
          if (row?.user_id && row.user_id !== selectedRef.current) return;
          if (payload.eventType === "INSERT") {
            const m = payload.new as Msg;
            setThread((prev) =>
              prev.some((x) => x.id === m.id) ? prev : [...prev, m],
            );
          } else if (payload.eventType === "UPDATE") {
            const m = payload.new as Msg;
            setThread((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setThread((prev) => prev.filter((x) => x.id !== old.id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread]);

  async function send() {
    const body = input.trim();
    if (!body || sending || !selected) return;
    setInput("");
    setSending(true);
    const temp: Msg = {
      id: `temp-${Date.now()}`,
      sender: "brandon",
      body,
      created_at: new Date().toISOString(),
    };
    setThread((prev) => [...prev, temp]);
    try {
      const r = await fetch("/api/support/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.userId, body }),
      });
      if (r.ok) {
        const d = await r.json();
        setThread((prev) => prev.map((x) => (x.id === temp.id ? d.message : x)));
        loadConvos();
      }
    } catch {
      /* queda el optimista */
    } finally {
      setSending(false);
    }
  }

  async function saveEdit(id: string) {
    const body = editVal.trim();
    setEditingId(null);
    if (!body) return;
    setThread((prev) => prev.map((m) => (m.id === id ? { ...m, body } : m)));
    try {
      await fetch("/api/support/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, body }),
      });
      loadConvos();
    } catch {
      /* el realtime corrige si falla */
    }
  }

  async function deleteMsg(id: string) {
    setThread((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch("/api/support/inbox", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      loadConvos();
    } catch {
      /* el realtime corrige si falla */
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? convos.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q),
        )
      : convos;
    // Sin responder primero; dentro de cada grupo, por más reciente
    return [...base].sort((a, b) => {
      const ap = a.pending > 0 ? 0 : 1;
      const bp = b.pending > 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return b.lastAt.localeCompare(a.lastAt);
    });
  }, [convos, query]);

  const pendingTotal = useMemo(
    () => convos.filter((c) => c.pending > 0).length,
    [convos],
  );

  return {
    convos,
    selected,
    setSelected,
    thread,
    input,
    setInput,
    sending,
    query,
    setQuery,
    editingId,
    setEditingId,
    editVal,
    setEditVal,
    scrollRef,
    openConvo,
    send,
    saveEdit,
    deleteMsg,
    filtered,
    pendingTotal,
  };
}
