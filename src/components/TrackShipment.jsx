// Example client component that calls /api/track and shows
// the current location / transit history, similar to the
// "Status Pesanan" timeline you have on the order page.

"use client";

import { useEffect, useState } from "react";

export default function TrackShipment({ waybillId, courierCode }) {
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!waybillId || !courierCode) return;

    async function fetchTracking() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/track?waybill_id=${encodeURIComponent(
            waybillId
          )}&courier_code=${encodeURIComponent(courierCode)}`
        );
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch tracking");
        }
        setTracking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTracking();
  }, [waybillId, courierCode]);

  if (loading) return <p>Loading tracking info...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!tracking) return null;

  const lastCheckpoint = tracking.history?.[tracking.history.length - 1];

  return (
    <div>
      <p>
        <strong>Status:</strong> {tracking.status}
      </p>
      {lastCheckpoint && (
        <p>
          <strong>Current location / last update:</strong>{" "}
          {lastCheckpoint.note} (
          {new Date(lastCheckpoint.updated_at).toLocaleString("id-ID")})
        </p>
      )}

      <h4>Full transit history</h4>
      <ul>
        {tracking.history?.map((entry, i) => (
          <li key={i}>
            <span>
              {new Date(entry.updated_at).toLocaleString("id-ID")}
            </span>{" "}
            — {entry.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
