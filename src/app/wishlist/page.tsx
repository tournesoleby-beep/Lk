"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useWishlist } from "@/components/cart/wishlist-provider";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";
import { ProductCard } from "@/components/home/product-card";

export default function WishlistPage() {
  const wishlist = useWishlist();

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Saved"
              title="Your wishlist"
              description={
                wishlist.count > 0
                  ? `${wishlist.count} ${
                      wishlist.count === 1 ? "piece" : "pieces"
                    } you've saved for later.`
                  : "Pieces you save will show up here."
              }
            />

            {wishlist.items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                {wishlist.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cloud">
                  <Heart className="h-7 w-7 text-slate" strokeWidth={1.5} />
                </div>
                <EmptyState message="Tap the heart on any product to save it here — your wishlist lives in this browser session." />
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
                >
                  Browse the shop
                </Link>
              </div>
            )}
          </Container>
        </section>
      </main>
    </div>
  );
}
