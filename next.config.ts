import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdfkit (used by the invoice PDF route) ships .afm font files that it
  // reads from disk at runtime — bundling it would break that lookup, so
  // it's kept external and required directly from node_modules instead.
  serverExternalPackages: ["pdfkit"],
  // Next.js caps Server Action request bodies at 1MB by default. Product
  // image uploads (src/lib/admin/actions.ts) and payment proof uploads
  // (src/lib/checkout/payment-actions.ts) both send the raw file straight
  // through a Server Action, so the framework default silently rejected
  // anything over 1MB before our own validation ever ran. Raised past the
  // 5MB business limit (see MAX_PRODUCT_IMAGE_BYTES / MAX_PAYMENT_PROOF_BYTES)
  // to leave headroom for multipart/form-data overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
