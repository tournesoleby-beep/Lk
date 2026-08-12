"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from "@/lib/email/order-emails";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { newOrderAdmin } from "@/lib/whatsapp/templates";
import { getCheckoutShippingRates } from "@/lib/checkout/shipping";

// Indonesian labels for the admin WhatsApp alert only — separate from the
// English STATUS_LABELS in src/lib/email/order-emails.ts, which serve the
// (English-language) email templates.
const WHATSAPP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  PAID: "Lunas",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Diterima",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana Dikembalikan",
  PAYMENT_REJECTED: "Pembayaran Ditolak",
};

export type CheckoutCartLine = {
  id: string; // product id — the cart has no variant selection today
  quantity: number;
};

export type PlaceOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

/**
 * Re-quote shipping for the given destination/cart server-side and pick
 * out the rate matching the customer's chosen courier + service, ignoring
 * whatever `shippingCost` the client sent. Returns an error if the quote
 * fails or no rate matches — this deliberately does NOT fall back to the
 * client-submitted cost, since that would defeat the point.
 *
 * A small tolerance (rather than exact equality) absorbs sub-unit
 * floating point noise between this call and the one the checkout page
 * made moments earlier; it does not meaningfully reopen the door to
 * tampering since the compared value comes from this fresh server quote,
 * not from the client.
 */
async function resolveShippingCost(
  areaId: string,
  address: string,
  courierCode: string,
  service: string,
  lines: CheckoutCartLine[]
): Promise<{ success: true; cost: number } | { success: false; error: string }> {
  const quote = await getCheckoutShippingRates({ areaId, geocodeQuery: address }, lines);
  if (!quote.success) {
    return { success: false, error: quote.error };
  }

  const matched = quote.rates.find(
    (rate) => rate.courierCode === courierCode && rate.service === service
  );
  if (!matched) {
    return {
      success: false,
      error: "Shipping rates have changed. Please recalculate shipping and try again.",
    };
  }

  return { success: true, cost: matched.cost };
}

/**
 * Place a guest order from the cart.
 *
 * Lapiita Karya has no customer accounts (see src/auth.config.ts) — cart,
 * wishlist, and checkout are all guest flows, but `Order.userId` is required
 * by the existing schema. To satisfy that without touching auth or the
 * schema, we find-or-create a lightweight `CUSTOMER` `User` row keyed on the
 * checkout email — no session or sign-in is created.
 *
 * The schema also has no dedicated `notes` field. `Address.line2` (an
 * optional free-text second address line) is reused to carry the customer's
 * order notes, since adding a column isn't allowed here.
 *
 * Prices/names are re-read from the database rather than trusted from the
 * client, so a stale cart or tampered payload can't change what's charged.
 * Shipping cost is handled the same way: the client's `shippingCost` is
 * only used to identify which quoted rate the customer picked (matched by
 * courierCode + service against a fresh server-side quote for the same
 * destination/weight, see `resolveShippingCost` below) — the amount
 * actually charged always comes from that fresh quote, never straight
 * from the request body.
 *
 * On success, this also sends a confirmation email to the customer and a
 * new-order alert to the store admin (see src/lib/email/order-emails.ts).
 * Both are best-effort — if either fails to send, the order still succeeds.
 */
export async function placeOrder(
  input: CheckoutInput,
  lines: CheckoutCartLine[]
): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { success: false, error: "Your bag is empty." };
  }

  const {
    fullName,
    phone,
    email,
    address,
    notes,
    shippingMethod,
    // Selected Biteship option (see checkoutSchema in
    // src/lib/validations/checkout.ts). `courier` is persisted below (as
    // `shippingCarrier`). `courierCode`, `service`, and `areaId` are used
    // to re-quote and verify shipping cost server-side (see
    // resolveShippingCost above) but have no dedicated column on `Order`
    // yet, so they aren't stored as-is. The client's `shippingCost` field
    // is intentionally not destructured here — it's never used, only the
    // server-recomputed `shippingCost` below is.
    courierCode,
    courier,
    service,
    areaId,
  } = parsed.data;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.id) } },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        status: true,
        weightGrams: true,
        variants: { select: { stock: true } },
      },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    const orderItemsData: { productId: string; name: string; price: number; quantity: number }[] = [];
    let shippingWeightGrams = 0;
    for (const line of lines) {
      const product = productsById.get(line.id);
      if (!product || product.status !== "ACTIVE") {
        return { success: false, error: "One of the items in your bag is no longer available." };
      }
      const quantity = Math.max(1, Math.floor(line.quantity) || 1);
      // Stock is tracked per `ProductVariant` (see prisma/schema.prisma);
      // sum across variants the same way the storefront displays it.
      const stock = product.variants.reduce((total, variant) => total + variant.stock, 0);
      if (quantity > stock) {
        return {
          success: false,
          error:
            stock === 0
              ? `"${product.name}" is out of stock.`
              : `Only ${stock} of "${product.name}" left in stock.`,
        };
      }
      orderItemsData.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price.toString()),
        quantity,
      });
      shippingWeightGrams += product.weightGrams * quantity;
    }

    const subtotal = orderItemsData.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const currency = products[0]?.currency ?? "IDR";

    // Never trust the client's shippingCost — re-quote it server-side for
    // this destination/cart and use the matching rate's cost instead (see
    // resolveShippingCost above).
    const shippingResult = await resolveShippingCost(areaId, address, courierCode, service, lines);
    if (!shippingResult.success) {
      return { success: false, error: shippingResult.error };
    }
    const shippingCost = shippingResult.cost;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: fullName, role: "CUSTOMER" },
    });

    const shippingAddress = await prisma.address.create({
      data: {
        userId: user.id,
        type: "SHIPPING",
        fullName,
        line1: address,
        line2: notes || null,
        city: "",
        postalCode: "",
        country: "",
        phone,
      },
    });

    // orderNumber is random (see generateOrderNumber) and unique-constrained;
    // retry a couple of times on the astronomically unlikely collision.
    let orderNumber = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        orderNumber = generateOrderNumber();
        const createdAt = new Date();
        const order = await prisma.order.create({
          data: {
            orderNumber,
            userId: user.id,
            subtotal,
            shippingTotal: shippingCost,
            total: subtotal + shippingCost,
            currency,
            shippingAddressId: shippingAddress.id,
            shippingMethod,
            shippingWeightGrams,
            shippingCarrier: courier,
            items: { create: orderItemsData },
          },
        });

        // Best-effort notification emails (customer confirmation + admin
        // alert). sendOrderConfirmationEmail/sendAdminOrderNotificationEmail
        // always resolve — a failure here must never fail the order itself.
        const emailData = {
          orderId: order.id,
          orderNumber,
          status: order.status,
          createdAt,
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: address,
          shippingNotes: notes || null,
          items: orderItemsData,
          subtotal,
          shippingCost,
          shippingMethod,
          courier,
          service,
          total: subtotal + shippingCost,
          currency,
        };

        // Best-effort admin WhatsApp alert. Wrapped in its own try/catch so
        // that any failure here (missing ADMIN_WHATSAPP, template error,
        // send failure) can never bubble up and fail the order — the same
        // best-effort guarantee as the emails above. sendWhatsAppMessage()
        // itself never throws, but this catch also covers newOrderAdmin()
        // and the env lookup around it.
        const notifyAdminWhatsApp = async () => {
          try {
            const adminWhatsApp = process.env.ADMIN_WHATSAPP;
            if (!adminWhatsApp) return;

            const message = newOrderAdmin({
              orderNumber,
              customerName: fullName,
              customerPhone: phone,
              total: subtotal + shippingCost,
              paymentStatus: WHATSAPP_STATUS_LABELS[order.status] ?? order.status,
              currency,
            });

            await sendWhatsAppMessage(adminWhatsApp, message);
          } catch (error) {
            console.error("[checkout] failed to send admin WhatsApp notification:", error);
          }
        };

        await Promise.allSettled([
          sendOrderConfirmationEmail(emailData),
          sendAdminOrderNotificationEmail(emailData),
          notifyAdminWhatsApp(),
        ]);

        return { success: true, orderNumber };
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;
        if (code === "P2002" && attempt < 2) continue;
        throw error;
      }
    }

    return { success: false, error: "Something went wrong placing your order. Please try again." };
  } catch (error) {
    console.error("[checkout] failed to place order:", error);
    return { success: false, error: "Something went wrong placing your order. Please try again." };
  }
}
