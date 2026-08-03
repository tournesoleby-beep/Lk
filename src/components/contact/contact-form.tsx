"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { sendContactMessage } from "@/lib/contact/actions";
import { useToast } from "@/components/providers/toast-provider";

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";
const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-2.5 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 sm:text-sm";

type FormValues = {
  fullName: string;
  email: string;
  message: string;
};

const EMPTY_VALUES: FormValues = { fullName: "", email: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!values.message.trim()) nextErrors.message = "Please enter a message.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await sendContactMessage(values);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    setSent(true);
    setValues(EMPTY_VALUES);
    toast({
      title: "Message sent",
      description: "We'll get back to you soon.",
      variant: "success",
    });
  }

  if (sent) {
    return (
      <div className="flex animate-in flex-col items-center gap-4 rounded-2xl border border-line px-6 py-12 text-center shadow-xs fade-in zoom-in-95 duration-300">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-signal">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">
            Message sent
          </h2>
          <p className="mt-1 text-sm text-slate">
            Thanks for reaching out — we&apos;ll get back to you soon.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-200 hover:text-signal"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Full name</span>
        <input
          value={values.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="Jane Doe"
          className={INPUT_CLASS}
        />
        {errors.fullName ? (
          <span className="text-xs text-signal">{errors.fullName}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Email</span>
        <input
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
          className={INPUT_CLASS}
        />
        {errors.email ? (
          <span className="text-xs text-signal">{errors.email}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Message</span>
        <textarea
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="How can we help?"
          rows={5}
          className={`${INPUT_CLASS} resize-none`}
        />
        {errors.message ? (
          <span className="text-xs text-signal">{errors.message}</span>
        ) : null}
      </label>

      {submitError ? (
        <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:w-auto sm:px-8"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : null}
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
