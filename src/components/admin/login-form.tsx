"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/products";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (!result || result.error) {
      setError("Email atau kata sandi salah. Silakan coba lagi.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
          Email
        </span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@lapiitakarya.com"
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
          Kata Sandi
        </span>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-medium uppercase tracking-[0.1em] text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Lock className="h-4 w-4" strokeWidth={1.75} />
        )}
        {submitting ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
