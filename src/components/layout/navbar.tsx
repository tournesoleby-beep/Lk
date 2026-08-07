"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/cart/wishlist-provider";
import { InstagramIcon } from "@/components/icons/instagram-icon";

const CATEGORY_LINKS = [
  { label: "Fashion", href: "/shop?category=fashion" },
  { label: "Makanan", href: "/shop?category=food" },
  { label: "Lacak Pesanan", href: "/orders/lookup" },
  { label: "Hubungi Kami", href: "/contact" },
] as const;

export function Navbar() {
  const cart = useCart();
  const wishlist = useWishlist();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 shadow-[0_1px_0_0_rgba(23,21,26,0.03)] backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
      {/* Thin contact bar — quiet, informational, visible at every breakpoint
          since this is now the site's featured Instagram touchpoint. */}
      <div className="block bg-ink py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-paper/85 sm:text-[11px] sm:tracking-[0.18em]">
        <a
          href="https://instagram.com/lapiitakarya"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-paper"
        >
          <InstagramIcon className="h-3.5 w-3.5" />
          <span>@lapiitakarya</span>
        </a>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-3 py-3 sm:gap-6 sm:px-6 sm:py-4 md:px-10">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud active:scale-95 md:hidden"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>

        <Link href="/" className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-11 w-11 shrink-0 object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03] sm:h-14 sm:w-14 md:h-16 md:w-16"
          />
          <span className="truncate font-serif text-base font-semibold tracking-tight text-ink transition-colors max-[360px]:hidden sm:text-lg md:text-xl">
            Lapiita Karya
          </span>
        </Link>

        {/* Category navigation — desktop */}
        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {CATEGORY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70 transition-colors duration-200 hover:text-signal"
            >
              {link.label}
              <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-0 bg-signal transition-all duration-300 ease-out group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Search — desktop inline, mobile toggled */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden max-w-xs flex-1 items-center md:flex lg:max-w-sm"
        >
          <Search
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate transition-colors"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari produk, merek…"
            aria-label="Cari produk"
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
          />
        </form>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud active:scale-95 md:hidden"
            aria-label="Buka/tutup pencarian"
            aria-expanded={searchOpen}
          >
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </button>

          {/* Wishlist — a direct, always-visible touch target on mobile
              rather than being buried in the hamburger menu, matching the
              bag's prominence. */}
          <Link
            href="/wishlist"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud hover:text-signal active:scale-95 md:h-9 md:w-9"
            aria-label={`Wishlist, ${wishlist.count} tersimpan`}
          >
            <Heart className="h-5 w-5" strokeWidth={1.75} />
            {wishlist.count > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-medium text-paper shadow-sm md:-right-0.5 md:-top-0.5">
                {wishlist.count}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={cart.open}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-all duration-200 hover:bg-cloud hover:text-signal active:scale-95 md:h-9 md:w-9"
            aria-label={`Keranjang belanja, ${cart.count} produk`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {cart.count > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-medium text-paper shadow-sm md:-right-0.5 md:-top-0.5">
                {cart.count}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Mobile search field */}
      {searchOpen ? (
        <form
          onSubmit={handleSearchSubmit}
          className="border-t border-line px-4 py-3 md:hidden"
        >
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate"
              strokeWidth={1.75}
            />
            {/* text-base (16px) rather than text-sm avoids iOS Safari's
                auto-zoom-on-focus for inputs under 16px. */}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari produk, merek…"
              aria-label="Cari produk"
              autoFocus
              className="h-11 w-full rounded-full border border-line bg-cloud/60 pl-10 pr-4 text-base text-ink outline-none transition-all duration-200 focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10"
            />
          </div>
        </form>
      ) : null}

      {/* Mobile menu */}
      {mobileOpen ? (
        <nav className="flex max-h-[calc(100svh-4rem)] flex-col gap-1 overflow-y-auto border-t border-line px-3 py-3 pb-safe duration-200 animate-in fade-in slide-in-from-top-1 md:hidden">
          {CATEGORY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-xl px-3.5 text-base font-medium text-ink transition-colors duration-200 hover:bg-cloud hover:text-signal active:bg-cloud"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/wishlist"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3.5 text-base font-medium text-ink transition-colors duration-200 hover:bg-cloud hover:text-signal active:bg-cloud"
          >
            Wishlist{wishlist.count > 0 ? ` (${wishlist.count})` : ""}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
