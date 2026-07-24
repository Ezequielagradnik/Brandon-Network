"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/components/LangProvider";

export default function EmailPasswordAuth({
  dark = false,
  next = "/dashboard/noticias",
}: {
  dark?: boolean;
  next?: string;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = createClient();
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(t.login.authError);
          setLoading(false);
          return;
        }
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
          },
        });
        if (error) {
          setError(t.login.authError);
          setLoading(false);
          return;
        }
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo(t.login.checkEmail);
          setLoading(false);
        }
      }
    } catch {
      setError(t.login.authError);
      setLoading(false);
    }
  }

  const inputCls = dark
    ? "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-ivory placeholder:text-text-muted/60 focus:border-gold/50 focus:outline-none"
    : "w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:border-gold/50 focus:outline-none";

  const linkCls = dark
    ? "text-text-muted hover:text-ivory"
    : "text-navy/55 hover:text-navy";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      {mode === "up" && (
        <input
          type="text"
          autoComplete="name"
          placeholder={t.login.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      )}
      <input
        type="email"
        required
        autoComplete="email"
        placeholder={t.login.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <input
        type="password"
        required
        minLength={6}
        autoComplete={mode === "in" ? "current-password" : "new-password"}
        placeholder={t.login.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
      />

      {error && <p className="text-xs text-down">{error}</p>}
      {info && (
        <p className={`text-xs ${dark ? "text-gold-soft" : "text-[var(--up)]"}`}>
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={
          dark
            ? "rounded-full bg-gold px-6 py-3 text-sm font-medium text-navy transition-all hover:opacity-90 disabled:opacity-60"
            : "rounded-full bg-navy px-6 py-3 text-sm font-medium text-ivory transition-all hover:bg-navy-2 disabled:opacity-60"
        }
      >
        {loading
          ? t.login.connecting
          : mode === "in"
            ? t.login.signIn
            : t.login.signUp}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setError("");
          setInfo("");
        }}
        className={`text-center text-xs ${linkCls}`}
      >
        {mode === "in" ? t.login.toSignUp : t.login.toSignIn}
      </button>
    </form>
  );
}
