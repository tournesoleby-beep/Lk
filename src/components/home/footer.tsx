import Link from "next/link";

import { Container } from "@/components/home/container";
import { InstagramIcon } from "@/components/icons/instagram-icon";

const footerColumns = [
  {
    heading: "Kategori",
    links: [
      { label: "Fashion", href: "/shop?category=fashion" },
      { label: "Makanan", href: "/shop?category=food" },
    ],
  },
  {
    heading: "Belanja",
    links: [
      { label: "Produk Terbaru", href: "/#new-arrivals" },
      { label: "Unggulan", href: "/#featured" },
      { label: "Semua Produk", href: "/shop" },
    ],
  },
  {
    heading: "Bantuan",
    links: [
      { label: "Lacak Pesanan", href: "/orders/lookup" },
      { label: "Hubungi Kami", href: "/contact" },
      { label: "Pengiriman & Pengembalian", href: "/shipping-returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
] as const;

// Instagram is currently the only channel Lapiita Karya is active on — keep
// this list to what's real rather than padding it with unused platforms.
const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/lapiitakarya",
    icon: InstagramIcon,
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="flex flex-col gap-10 px-5 py-12 sm:gap-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 sm:gap-10">
          <div className="col-span-2 flex flex-col gap-3.5 sm:col-span-1 sm:gap-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                className="h-12 w-12 object-contain sm:h-16 sm:w-16"
              />
              <span className="font-serif text-base font-semibold tracking-tight text-ink sm:text-lg">
                Lapiita Karya
              </span>
            </div>
            <p className="max-w-[220px] text-sm leading-relaxed text-slate">
              Dibuat dengan tangan penuh makna, dibangun dari pelatihan vokasi.
            </p>
            <div className="flex items-center gap-3 pt-1 sm:pt-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:text-signal hover:shadow-sm sm:h-9 sm:w-9"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3 sm:gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate sm:text-[11px] sm:tracking-[0.2em]">
                {column.heading}
              </span>
              <ul className="flex flex-col gap-1 sm:gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex min-h-9 items-center text-sm text-ink/80 transition-colors duration-200 hover:text-signal sm:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="font-mono text-xs text-slate">
            © {new Date().getFullYear()} Charolina Eydet. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-mono text-xs text-slate transition-colors hover:text-ink"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms"
              className="font-mono text-xs text-slate transition-colors hover:text-ink"
            >
              Syarat dan Ketentuan
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
