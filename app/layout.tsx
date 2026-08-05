import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { CartDrawer } from "@/components/cart/cart-drawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif used for campaign headlines (hero, section titles) to
// give Lapiita Karya a considered, boutique feel rather than a marketplace one.
const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// TODO: replace with the production domain once it's finalized.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapiitakarya.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lapiita Karya — Produk buatan tangan dari program pelatihan vokasi",
  description:
    "Lapiita Karya menghadirkan produk fashion, makanan, dan hasil produksi buatan tangan berkualitas premium yang dibuat oleh perempuan yang sedang mengembangkan keterampilan baru melalui pelatihan vokasi.",
  openGraph: {
    title: "Lapiita Karya — Produk buatan tangan dari program pelatihan vokasi",
    description:
      "Lapiita Karya menghadirkan produk fashion, makanan, dan hasil produksi buatan tangan berkualitas premium yang dibuat oleh perempuan yang sedang mengembangkan keterampilan baru melalui pelatihan vokasi.",
    url: siteUrl,
    siteName: "Lapiita Karya",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// viewportFit: "cover" lets the safe-area-inset-* env() variables populate
// on notched/home-indicator iPhones, which the sticky mobile add-to-bag
// bar and cart drawer footer rely on (see .pb-safe in globals.css).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-paper text-ink">
        <Providers session={session}>
          <Navbar />
          {children}
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
