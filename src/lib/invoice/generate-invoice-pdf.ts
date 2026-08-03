import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/components/admin/order-status-badge";
import type { InvoiceOrder } from "@/lib/checkout/orders";

const INK = "#1a1a1a";
const SLATE = "#6b6b6b";
const LINE = "#e4e4e4";

/**
 * Renders a single-page invoice PDF for a paid (or paid-equivalent) order,
 * returned as a Buffer so the API route can stream it back with the right
 * headers. Built with pdfkit rather than a React/HTML-to-PDF pipeline to
 * keep this a small, dependency-light server module — the invoice layout
 * itself is simple enough not to need a templating layer.
 */
export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const logoPath = path.join(process.cwd(), "public", "logo.png");

  // --- Header: logo + brand, invoice meta -----------------------------
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 44, height: 44 });
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(INK)
    .text("Lapiita Karya", 104, 50);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(SLATE)
    .text("Lapas Perempuan Kelas IIA Jakarta", 104, 70);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(INK)
    .text("INVOICE", 0, 50, { align: "right" });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(SLATE)
    .text(`Order ${order.orderNumber}`, { align: "right" })
    .text(formatDate(order.createdAt), { align: "right" });

  doc.moveTo(50, 105).lineTo(545, 105).strokeColor(LINE).stroke();

  // --- Bill to / order info ---------------------------------------------
  let y = 125;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(SLATE).text("BILL TO", 50, y);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(SLATE).text("PAYMENT STATUS", 320, y);
  y += 15;

  doc.font("Helvetica").fontSize(10).fillColor(INK).text(order.customerName, 50, y);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(INK)
    .text(ORDER_STATUS_LABELS[order.status], 320, y);
  y += 16;

  if (order.shippingAddress) {
    const { line1, line2, city, state, postalCode, country, phone } = order.shippingAddress;
    const addressLines = [
      line1,
      line2 ?? undefined,
      [city, state, postalCode].filter(Boolean).join(", "),
      country,
      phone ? `Phone: ${phone}` : undefined,
    ].filter((line): line is string => Boolean(line && line.trim()));

    doc.font("Helvetica").fontSize(9).fillColor(SLATE);
    for (const line of addressLines) {
      doc.text(line, 50, y, { width: 240 });
      y += 13;
    }
  }

  // --- Line items table ---------------------------------------------------
  const tableTop = Math.max(y + 20, 210);
  const columns = {
    item: 50,
    qty: 340,
    unitPrice: 400,
    total: 475,
  };

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(SLATE)
    .text("ITEM", columns.item, tableTop)
    .text("QTY", columns.qty, tableTop, { width: 40, align: "right" })
    .text("UNIT PRICE", columns.unitPrice, tableTop, { width: 65, align: "right" })
    .text("TOTAL", columns.total, tableTop, { width: 70, align: "right" });

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(545, tableTop + 15)
    .strokeColor(LINE)
    .stroke();

  let rowY = tableTop + 24;
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  for (const item of order.items) {
    const lineTotal = item.price * item.quantity;
    const rowHeight = doc.heightOfString(item.name, { width: 270 });

    doc.text(item.name, columns.item, rowY, { width: 270 });
    doc.text(String(item.quantity), columns.qty, rowY, { width: 40, align: "right" });
    doc.text(formatCurrency(item.price, order.currency), columns.unitPrice, rowY, {
      width: 65,
      align: "right",
    });
    doc.text(formatCurrency(lineTotal, order.currency), columns.total, rowY, {
      width: 70,
      align: "right",
    });

    rowY += Math.max(rowHeight, 14) + 10;
  }

  doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE).stroke();
  rowY += 12;

  // --- Totals -------------------------------------------------------------
  const totalsRow = (label: string, value: string, bold = false) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 11 : 9)
      .fillColor(bold ? INK : SLATE)
      .text(label, 340, rowY, { width: 105, align: "left" });
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 11 : 9)
      .fillColor(INK)
      .text(value, columns.total, rowY, { width: 70, align: "right" });
    rowY += bold ? 18 : 14;
  };

  totalsRow("Subtotal", formatCurrency(order.subtotal, order.currency));
  if (order.shippingTotal > 0) {
    totalsRow("Shipping", formatCurrency(order.shippingTotal, order.currency));
  }
  if (order.taxTotal > 0) {
    totalsRow("Tax", formatCurrency(order.taxTotal, order.currency));
  }
  rowY += 4;
  totalsRow("Total", formatCurrency(order.total, order.currency), true);

  // --- Footer ---------------------------------------------------------
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(SLATE)
    .text(
      "Thank you for supporting Lapiita Karya — handmade goods from a vocational training program.",
      50,
      760,
      { width: 495, align: "center" }
    );

  doc.end();
  return done;
}
