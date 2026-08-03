import { NextResponse } from "next/server";

import { getOrderForInvoice, PAID_EQUIVALENT_STATUSES } from "@/lib/checkout/orders";
import { generateInvoicePdf } from "@/lib/invoice/generate-invoice-pdf";

// pdfkit reads its .afm font metrics from disk and writes a Buffer — needs
// the Node runtime, not the Edge runtime.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const order = await getOrderForInvoice(decodeURIComponent(orderNumber));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Mirrors the confirmed-status check on /orders/lookup: an invoice only
  // makes sense once payment has actually been received, so this refuses
  // to generate one for a pending/unpaid order even if the URL is guessed
  // or bookmarked directly.
  if (!PAID_EQUIVALENT_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: "Invoice is not available until payment is confirmed" },
      { status: 403 }
    );
  }

  const pdfBuffer = await generateInvoicePdf(order);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
