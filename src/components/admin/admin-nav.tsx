"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { label: "Produk", href: "/admin/products" },
  { label: "Pesanan", href: "/admin/orders" },
  { label: "Ulasan", href: "/admin/reviews" },
  { label: "Analitik", href: "/admin/analytics" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5">
      {ADMIN_LINKS.map((link) => {
        const isActive = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95",
              isActive
                ? "bg-ink text-paper shadow-sm"
                : "border border-line text-slate hover:border-ink/25 hover:bg-cloud/60 hover:text-ink"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
