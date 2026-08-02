import Link from "next/link";
import { Camera, Play, Users } from "lucide-react";

import { Container } from "@/components/home/container";

// Lucide 1.0 removed all trademarked brand icons (Facebook, Instagram,
// YouTube, etc.) for legal reasons — see https://lucide.dev/guide/react/migration.
// These generic icons stand in for the real platforms below; the platform
// names still surface via the link label and aria-label.

const footerColumns = [
  {
    heading: "Categories",
    links: [
      { label: "Fashion", href: "/shop?category=fashion" },
      { label: "Food", href: "/shop?category=food" },
      { label: "Production", href: "/shop?category=production" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    heading: "Shop",
    links: [
      { label: "New arrivals", href: "/#new-arrivals" },
      { label: "Featured", href: "/#featured" },
      { label: "All products", href: "/shop" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Track an order", href: "/orders/lookup" },
      { label: "Contact us", href: "/contact" },
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
] as const;

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: Camera },
  { label: "Facebook", href: "https://facebook.com", icon: Users },
  { label: "YouTube", href: "https://youtube.com", icon: Play },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="flex flex-col gap-16 py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-1">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                className="h-16 w-16 object-contain"
              />
              <span className="font-serif text-lg font-semibold tracking-tight text-ink">
                Lapiita Karya
              </span>
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-slate">
              Considered pieces, made to last.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-ink/20 hover:text-ink"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-4">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-slate">
                {column.heading}
              </span>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/80 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-slate">
            © {new Date().getFullYear()} Charolina Eydet. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-mono text-xs text-slate transition-colors hover:text-ink"
            >
              Privacy policy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-xs text-slate transition-colors hover:text-ink"
            >
              Terms of service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
