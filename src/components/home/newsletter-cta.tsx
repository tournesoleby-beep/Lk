"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

import { Container } from "@/components/home/container";
import { cn, sleep } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "loading" | "success" | "error";

/**
 * Email capture section. There's no newsletter table/endpoint in the schema
 * yet, so this simulates the round trip client-side (validate -> "submit"
 * -> success state). Swap the `sleep` call for a real POST once a subscribe
 * endpoint exists.
 */
export function NewsletterCta() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus("error");
      setError("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setError(null);
    await sleep(600);
    setStatus("success");
    toast({
      title: "You're on the list",
      description: "One email a month, at most.",
      variant: "success",
    });
  }

  return (
    <section className="bg-ink py-16 sm:py-24 md:py-32">
      <Container className="flex flex-col items-center gap-6 text-center sm:gap-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15">
          <Mail className="h-5 w-5 text-signal" strokeWidth={1.75} />
        </div>

        <div className="flex max-w-xl flex-col gap-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
            Newsletter
          </span>
          <h2 className="font-serif text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-paper sm:text-[2.75rem]">
            Join our newsletter
          </h2>
          <p className="text-balance text-base leading-relaxed text-white/60 sm:text-lg">
            One email a month, at most — updates, restock notices, and notes
            from the studio, nothing else.
          </p>
        </div>

        {status === "success" ? (
          <div className="flex animate-in items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-paper shadow-sm fade-in zoom-in-95 duration-300">
            <Check className="h-4 w-4 text-signal" strokeWidth={2} />
            You&apos;re on the list.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="flex-1 text-left">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setError(null);
                  }
                }}
                className={cn(
                  "h-11 w-full rounded-full border bg-white/5 px-5 text-base text-paper outline-none transition-all duration-200 placeholder:text-white/40 focus:border-signal focus:ring-4 focus:ring-signal/20 sm:h-auto sm:py-3 sm:text-sm",
                  status === "error" ? "border-red-500/60" : "border-white/15"
                )}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "newsletter-error" : undefined}
              />
              {status === "error" && error ? (
                <p id="newsletter-error" className="mt-2 text-xs text-red-400">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-all duration-200 hover:bg-white/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
              {status !== "loading" ? (
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              ) : null}
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
