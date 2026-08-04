"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col items-center gap-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-signal">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
            </span>

            <SectionHeading
              eyebrow="Error"
              title="Something went wrong"
              description="We hit an unexpected error loading this page. You can try again, or head back home."
              align="center"
            />

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink transition-all duration-200 hover:border-ink/35 hover:bg-cloud active:scale-[0.98]"
              >
                Back to home
              </Link>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
