"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
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
              "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
              isActive
                ? "bg-ink text-paper"
                : "border border-line text-slate hover:bg-cloud/60"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
