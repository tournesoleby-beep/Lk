import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { getBiteshipTracking, type BiteshipTracking } from "@/lib/biteship";

/**
 * Statuses that mean "payment has been received/verified" — shared by the
 * /orders/lookup page (to decide which of the confirmed-vs-pending UI to
 * show, including the Download Invoice button) and the invoice PDF route
 * (to refuse generating an invoice for an order that hasn't actually been
 * paid yet, even if someone guesses/bookmarks the invoice URL).
 */
export const PAID_EQUIVALENT_STATUSES = new Set<OrderStatus>([
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]);

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
  paymentProofUrl: string | null;
};

/**
 * Look up an order by its order number for the /checkout/payment page.
 *
 * Lapiita Karya has no customer accounts (see src/auth.config.ts), so — same
 * as the pre-existing /checkout/success page — this is a public, unauth'd
 * lookup keyed on the order number the customer was just given. It only
 * returns the fields the payment page needs, not the full order.
 */
export async function getOrderForPayment(orderNumber: string): Promise<PaymentOrder | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        paymentProofUrl: true,
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total.toString()),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      paymentProofUrl: order.paymentProofUrl,
    };
  } catch (error) {
    console.error("[checkout] failed to load order for payment:", error);
    return null;
  }
}

export type InvoiceOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type InvoiceOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  items: InvoiceOrderItem[];
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
};

/**
 * Look up everything the /orders/[orderNumber]/invoice PDF route needs.
 * Same public, unauth'd-by-orderNumber lookup model as getOrderForPayment
 * above — the invoice route itself is what enforces the paid-only check
 * (see PAID_EQUIVALENT_STATUSES), not this query.
 */
export async function getOrderForInvoice(orderNumber: string): Promise<InvoiceOrder | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        subtotal: true,
        shippingTotal: true,
        taxTotal: true,
        total: true,
        currency: true,
        user: { select: { name: true } },
        shippingAddress: {
          select: {
            fullName: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
          },
        },
        items: { select: { id: true, name: true, price: true, quantity: true } },
      },
    });

    if (!order) return null;

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      customerName: order.shippingAddress?.fullName ?? order.user.name ?? "—",
      shippingAddress: order.shippingAddress
        ? {
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price.toString()),
        quantity: item.quantity,
      })),
      subtotal: Number(order.subtotal.toString()),
      shippingTotal: Number(order.shippingTotal.toString()),
      taxTotal: Number(order.taxTotal.toString()),
      total: Number(order.total.toString()),
      currency: order.currency,
    };
  } catch (error) {
    console.error("[checkout] failed to load order for invoice:", error);
    return null;
  }
}

export type TrackingOrderItemReview = {
  id: string;
  rating: number;
  approved: boolean;
  featured: boolean;
  createdAt: string;
};

export type TrackingOrderItem = {
  id: string;
  // Nullable to match OrderItem.productId in schema.prisma (SetNull if the
  // product was later deleted) — the review form only renders for items
  // that still have one, since a review needs a live productId to attach
  // to (see ReviewForm / submitReview).
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  variant: { name: string } | null;
  product: { images: { url: string; altText: string | null }[] } | null;
  review: TrackingOrderItemReview | null;
};

export type TrackingOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  createdAt: string;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  // Live checkpoint history from Biteship's public tracking API, fetched
  // fresh on every call to getOrderForTracking below (see
  // src/lib/biteship.ts). `null` means either there's no tracking number
  // yet, or the live lookup failed/returned nothing — the page falls back
  // to showing just the carrier + tracking number in that case, same as
  // before this existed.
  biteshipTracking: BiteshipTracking | null;
  shippingAddress: {
    fullName: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
  } | null;
  items: TrackingOrderItem[];
};

/**
 * Expand a customer-entered phone number into the Indonesian formats it
 * might be stored as on Address.phone — `0812...`, `62812...`, and
 * `+62812...` — by normalizing to the bare national number (no leading 0
 * or country code) and rebuilding each variant. Returns [] for input with
 * no digits at all, so callers can treat that as "no match" without a
 * wasted query.
 */
function phoneNumberVariants(input: string): string[] {
  const digits = input.replace(/\D/g, "");
  const core = digits.startsWith("62")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (!core) return [];

  return [`0${core}`, `62${core}`, `+62${core}`];
}

export type PhoneTrackingOrderSummary = {
  orderNumber: string;
  status: OrderStatus;
};

/**
 * Look up orders by shipping phone number for the /orders/lookup page's
 * phone-search path. A phone number can belong to several orders, so this
 * only returns order number + status for each match — no address, totals,
 * or other detail — since matching a phone number isn't proof of identity
 * the way an exact order number is. The customer picks the specific order
 * from that list to see its full tracking detail via getOrderForTracking
 * (same public, unauth'd-by-orderNumber lookup model used there).
 */
export async function getOrdersForPhoneTracking(
  phone: string
): Promise<PhoneTrackingOrderSummary[]> {
  const variants = phoneNumberVariants(phone);
  if (variants.length === 0) return [];

  try {
    return await prisma.order.findMany({
      where: { shippingAddress: { phone: { in: variants } } },
      select: { orderNumber: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    console.error("[checkout] failed to load orders for phone tracking:", error);
    return [];
  }
}

/**
 * Look up everything the /orders/lookup tracking page needs — order +
 * timeline status, shipping address, line items (with variant/first product
 * image), payment totals, and carrier/tracking info. Same public,
 * unauth'd-by-orderNumber lookup model as getOrderForPayment and
 * getOrderForInvoice above.
 */
export async function getOrderForTracking(orderNumber: string): Promise<TrackingOrder | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        subtotal: true,
        shippingTotal: true,
        createdAt: true,
        shippingCarrier: true,
        biteshipCourierCode: true,
        trackingNumber: true,
        shippingAddress: {
          select: {
            fullName: true,
            phone: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            productId: true,
            variant: { select: { name: true } },
            product: {
              select: {
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { url: true, altText: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    // One review per product per order (see ProductReview's @@unique in
    // schema.prisma), so a single findMany keyed on this order's id and its
    // items' product ids is enough — no per-item query, and it's skipped
    // entirely when the order has no items.
    const productIds = order.items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const reviews = productIds.length
      ? await prisma.productReview.findMany({
          where: { orderId: order.id, productId: { in: productIds } },
          select: {
            id: true,
            productId: true,
            rating: true,
            approved: true,
            featured: true,
            createdAt: true,
          },
        })
      : [];
    const reviewByProductId = new Map(reviews.map((review) => [review.productId, review]));

    // Best-effort: a Biteship outage or bad response should never take
    // down the whole tracking page — the page just falls back to showing
    // carrier + tracking number with no live checkpoint history, same as
    // before this integration existed. See getBiteshipTracking's own
    // try/catch for the actual network handling; this one guards against
    // anything unexpected slipping past that.
    let biteshipTracking: BiteshipTracking | null = null;
    if (order.trackingNumber && order.biteshipCourierCode) {
      try {
        biteshipTracking = await getBiteshipTracking(
          order.trackingNumber,
          order.biteshipCourierCode
        );
      } catch (error) {
        console.error("[checkout] failed to fetch live Biteship tracking:", error);
      }
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total.toString()),
      currency: order.currency,
      subtotal: Number(order.subtotal.toString()),
      shippingTotal: Number(order.shippingTotal.toString()),
      createdAt: order.createdAt.toISOString(),
      shippingCarrier: order.shippingCarrier,
      trackingNumber: order.trackingNumber,
      biteshipTracking,
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          }
        : null,
      items: order.items.map((item) => {
        const review = item.productId
          ? reviewByProductId.get(item.productId) ?? null
          : null;

        return {
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: Number(item.price.toString()),
          quantity: item.quantity,
          variant: item.variant ? { name: item.variant.name } : null,
          product: item.product ? { images: item.product.images } : null,
          review: review
            ? {
                id: review.id,
                rating: review.rating,
                approved: review.approved,
                featured: review.featured,
                createdAt: review.createdAt.toISOString(),
              }
            : null,
        };
      }),
    };
  } catch (error) {
    console.error("[checkout] failed to load order for tracking:", error);
    return null;
  }
}
