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

export const metadata: Metadata = {
  title: "Lapiita Karya — Handmade goods from a vocational training program",
  description:
    "Lapiita Karya is a social enterprise: premium handmade fashion, food, and production pieces made by women building new skills through vocational training.",
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
      lang="en"
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
