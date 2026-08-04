import { EmptyState } from "@/components/home/empty-state";

type ShippingAddressData = {
  fullName: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
};

/**
 * "Shipping Address" section on the order tracking page — recipient,
 * phone, and the full address joined into one readable line. Purely
 * presentational: renders whatever `order.shippingAddress` already holds,
 * no address validation or geocoding.
 */
export function ShippingAddressSummary({
  address,
}: {
  address: ShippingAddressData | null | undefined;
}) {
  if (!address) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-base font-semibold text-ink">Alamat Pengiriman</h2>
        <EmptyState message="Alamat pengiriman belum tersedia untuk pesanan ini." />
      </div>
    );
  }

  const fullAddress = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-base font-semibold text-ink">Alamat Pengiriman</h2>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">{address.fullName}</span>
        {address.phone ? <span className="text-slate">{address.phone}</span> : null}
        <span className="leading-relaxed text-slate">{fullAddress}</span>
      </div>
    </div>
  );
}
