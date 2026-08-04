// Manual smoke test for src/lib/whatsapp/client.ts — sends one fixed test
// message to TEST_WHATSAPP_NUMBER via Fonnte and prints the result.
//
// Usage:
//   TEST_WHATSAPP_NUMBER=6281234567890 npx tsx scripts/test-whatsapp.ts
//
// Requires FONNTE_TOKEN (read by the client itself) and
// TEST_WHATSAPP_NUMBER (read here) to be set, either on the command line
// or in a .env file (loaded automatically below via "dotenv/config").

import "dotenv/config";

import { sendWhatsAppMessage } from "../src/lib/whatsapp/client";

const TEST_MESSAGE = "Test notifikasi WhatsApp Lapiita berhasil";

async function main() {
  const destination = process.env.TEST_WHATSAPP_NUMBER;
  if (!destination) {
    console.error("[test-whatsapp] TEST_WHATSAPP_NUMBER is not set — nothing to send to.");
    process.exitCode = 1;
    return;
  }

  const result = await sendWhatsAppMessage(destination, TEST_MESSAGE);

  if (result.success) {
    console.log("[test-whatsapp] success:", result);
  } else {
    console.error("[test-whatsapp] error:", result.error);
    process.exitCode = 1;
  }
}

main();
