"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { WishlistProvider } from "@/components/cart/wishlist-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
