"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from "@/lib/email/order-emails";

export type CheckoutCartLine = {
  id: string; // product id — the cart has no variant selection today
  quantity: number;
};

export type PlaceOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

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

  const { fullName, phone, email, address, notes } = parsed.data;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.id) } },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        status: true,
        variants: { select: { stock: true } },
      },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    const orderItemsData: { productId: string; name: string; price: number; quantity: number }[] = [];
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
    }

    const subtotal = orderItemsData.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const currency = products[0]?.currency ?? "IDR";

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
        await prisma.order.create({
          data: {
            orderNumber,
            userId: user.id,
            subtotal,
            total: subtotal,
            currency,
            shippingAddressId: shippingAddress.id,
            items: { create: orderItemsData },
          },
        });

        // Best-effort notification emails (customer confirmation + admin
        // alert). sendOrderConfirmationEmail/sendAdminOrderNotificationEmail
        // always resolve — a failure here must never fail the order itself.
        await Promise.allSettled([
          sendOrderConfirmationEmail({
            orderNumber,
            customerName: fullName,
            customerEmail: email,
            total: subtotal,
            currency,
            createdAt,
            items: orderItemsData,
          }),
          sendAdminOrderNotificationEmail({
            orderNumber,
            customerName: fullName,
            customerEmail: email,
            total: subtotal,
            currency,
            createdAt,
            items: orderItemsData,
          }),
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
