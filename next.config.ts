import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdfkit (used by the invoice PDF route) ships .afm font files that it
  // reads from disk at runtime — bundling it would break that lookup, so
  // it's kept external and required directly from node_modules instead.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
