import { config } from "dotenv";
config({ path: ".env" });

import { resolveStoreAreaId } from "./src/lib/shipping/location";

async function main() {
  const result = await resolveStoreAreaId();

  console.log("=== STORE ORIGIN ===");
  console.dir(result, { depth: null });

  if (result.success) {
    console.log("\nCopy these into .env.local:");

    console.log(`BITESHIP_ORIGIN_AREA_ID=${result.area.areaId}`);

    if ("latitude" in result.area && result.area.latitude != null) {
      console.log(`BITESHIP_ORIGIN_LATITUDE=${result.area.latitude}`);
    }

    if ("longitude" in result.area && result.area.longitude != null) {
      console.log(`BITESHIP_ORIGIN_LONGITUDE=${result.area.longitude}`);
    }
  } else {
    console.error(result.error);
  }
}

main().catch(console.error);