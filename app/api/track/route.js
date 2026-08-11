// app/api/track/route.js
// Next.js App Router API route for tracking shipments via Biteship.
//
// Usage from the frontend:
//   GET /api/track?waybill_id=0123082100003094&courier_code=jne
//
// Make sure your Vercel environment variable is named exactly
// what you use below (e.g. BITESHIP_API_KEY). Rename either side
// so they match.

import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const waybillId = searchParams.get("waybill_id");
  const courierCode = searchParams.get("courier_code");

  if (!waybillId || !courierCode) {
    return NextResponse.json(
      {
        success: false,
        message: "waybill_id and courier_code query params are required",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.biteship.com/v1/trackings/${waybillId}/couriers/${courierCode}`,
      {
        method: "GET",
        headers: {
          // Biteship expects the raw API key in the Authorization header
          // (not "Bearer <key>"). If you get a 401, double check the key
          // in your Biteship dashboard isn't accidentally prefixed.
          Authorization: process.env.BITESHIP_API_KEY,
        },
        // Avoid caching stale tracking data
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok || data.success === false) {
      return NextResponse.json(data, { status: res.status || 400 });
    }

    // data.status        -> current overall status (e.g. "delivered", "on_process")
    // data.history        -> array of { note, updated_at } checkpoints, most recent last
    // data.courier         -> courier company + driver info if available
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reach Biteship",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
