"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/cart/wishlist-provider";

const CATEGORY_LINKS = [
  { label: "Fashion", href: "/shop?category=fashion" },
  { label: "Food", href: "/shop?category=food" },
  { label: "Production", href: "/shop?category=production" },
  { label: "Contact us", href: "/contact" },
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
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      {/* Thin announcement bar — quiet, informational, no urgency/discount tone */}
      <div className="hidden bg-ink py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-paper/85 sm:block">
        Complimentary shipping on orders over $150 · Easy 60-day returns
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          )}
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
          <span className="font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
            Lapiita Karya
          </span>
        </Link>

        {/* Category navigation — desktop */}
        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {CATEGORY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70 transition-colors hover:text-signal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search — desktop inline, mobile toggled */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden max-w-xs flex-1 items-center md:flex lg:max-w-sm"
        >
          <Search
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands…"
            aria-label="Search products"
            className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-slate focus:border-signal/50 focus:bg-paper"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud md:hidden"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <Link
            href="/wishlist"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud sm:flex"
            aria-label={`Wishlist, ${wishlist.count} saved`}
          >
            <Heart className="h-5 w-5" strokeWidth={1.75} />
            {wishlist.count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-medium text-paper">
                {wishlist.count}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={cart.open}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cloud"
            aria-label={`Shopping bag, ${cart.count} items`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {cart.count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-medium text-paper">
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
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands…"
              aria-label="Search products"
              autoFocus
              className="w-full rounded-full border border-line bg-cloud/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-signal/50 focus:bg-paper"
            />
          </div>
        </form>
      ) : null}

      {/* Mobile menu */}
      {mobileOpen ? (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          {CATEGORY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cloud"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/wishlist"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Wishlist{wishlist.count > 0 ? ` (${wishlist.count})` : ""}
          </Link>
          <Link
            href="/orders/lookup"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cloud"
          >
            Track an order
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
