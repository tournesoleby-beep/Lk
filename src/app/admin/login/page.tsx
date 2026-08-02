import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { Container } from "@/components/home/container";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login — Lapiita Karya",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cloud/40 py-16">
      <Container className="flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-1.5 text-center">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-signal">
              Admin
            </span>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Sign in
            </h1>
            <p className="text-sm text-slate">
              Restricted to Lapiita Karya staff.
            </p>
          </div>

          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-xs text-slate transition-colors hover:text-ink"
          >
            ← Back to store
          </Link>
        </div>
      </Container>
    </div>
  );
}
