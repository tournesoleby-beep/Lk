"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { getProvinces, getRegencies, getDistricts, type WilayahOption } from "@/lib/wilayah";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrder } from "@/lib/checkout/actions";
import { getCheckoutShippingRates, type CheckoutShippingRate } from "@/lib/checkout/shipping";
import type { ShippingMethod } from "@/lib/validations/checkout";
import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { EmptyState } from "@/components/home/empty-state";

const LABEL_CLASS =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate";
const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-cloud/60 px-3.5 py-3 text-base text-ink outline-none transition-all duration-200 placeholder:text-slate focus:border-signal/50 focus:bg-paper focus:ring-4 focus:ring-signal/10 sm:py-2.5 sm:text-sm";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  provinceId: string;
  city: string;
  cityId: string;
  district: string;
  districtId: string;
  postalCode: string;
  areaId: string;
  streetAddress: string;
  notes: string;
  shippingMethod: ShippingMethod;
};

const EMPTY_VALUES: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  province: "",
  provinceId: "",
  city: "",
  cityId: "",
  district: "",
  districtId: "",
  postalCode: "",
  areaId: "",
  streetAddress: "",
  notes: "",
  shippingMethod: "standard",
};

type PostalOption = { areaId: string; postalCode: string; label: string };

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const currency = cart.lines[0]?.currency ?? "IDR";

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [provinces, setProvinces] = useState<WilayahOption[]>([]);
  const [regencies, setRegencies] = useState<WilayahOption[]>([]);
  const [districts, setDistricts] = useState<WilayahOption[]>([]);
  const [postalOptions, setPostalOptions] = useState<PostalOption[]>([]);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [postalError, setPostalError] = useState<string | null>(null);

  const [shippingRates, setShippingRates] = useState<CheckoutShippingRate[]>([]);
  const [selectedRateIndex, setSelectedRateIndex] = useState<number | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [shippingRatesError, setShippingRatesError] = useState<string | null>(null);

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  function update(field: keyof Omit<FormValues, "shippingMethod">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleProvinceChange(provinceId: string) {
    const name = provinces.find((p) => p.id === provinceId)?.name ?? "";
    setValues((current) => ({
      ...current,
      provinceId,
      province: name,
      cityId: "",
      city: "",
      districtId: "",
      district: "",
      postalCode: "",
      areaId: "",
    }));
    setRegencies([]);
    setDistricts([]);
    setPostalOptions([]);
    setPostalError(null);
    if (provinceId) setRegencies(await getRegencies(provinceId));
  }

  async function handleCityChange(cityId: string) {
    const name = regencies.find((c) => c.id === cityId)?.name ?? "";
    setValues((current) => ({
      ...current,
      cityId,
      city: name,
      districtId: "",
      district: "",
      postalCode: "",
      areaId: "",
    }));
    setDistricts([]);
    setPostalOptions([]);
    setPostalError(null);
    if (cityId) setDistricts(await getDistricts(cityId));
  }

  async function handleDistrictChange(districtId: string) {
    const name = districts.find((d) => d.id === districtId)?.name ?? "";
    setValues((current) => ({
      ...current,
      districtId,
      district: name,
      postalCode: "",
      areaId: "",
    }));
    setPostalOptions([]);
    setPostalError(null);
    if (!districtId) return;

    setIsLoadingPostal(true);
    try {
      const query = [name, values.city, values.province].filter(Boolean).join(", ");
      const params = new URLSearchParams({ q: query, district: name });
      const res = await fetch(`/api/shipping/postal-codes?${params.toString()}`);
      const data = await res.json();
      if (!data.success) {
        setPostalError(data.error ?? "Gagal memuat kode pos.");
        return;
      }
      setPostalOptions(
        data.areas.map((a: { areaId: string; postalCode: number; name: string }) => ({
          areaId: a.areaId,
          postalCode: String(a.postalCode),
          label: a.name,
        }))
      );
    } catch (error) {
      console.error("[checkout] failed to load postal codes:", error);
      setPostalError("Gagal memuat kode pos.");
    } finally {
      setIsLoadingPostal(false);
    }
  }

  function handlePostalChange(areaId: string) {
    const option = postalOptions.find((o) => o.areaId === areaId);
    setValues((current) => ({
      ...current,
      areaId,
      postalCode: option?.postalCode ?? "",
    }));
  }

  async function handleCalculateShipping() {
    setShippingRatesError(null);

    if (!values.areaId) {
      setShippingRatesError("Pilih provinsi, kota, kecamatan, dan kode pos terlebih dahulu.");
      return;
    }
    if (cart.lines.length === 0) {
      setShippingRatesError("Keranjang Anda kosong.");
      return;
    }

    // Used only to geocode a lat/lng point for pricing GoSend/GrabExpress —
    // values.areaId above already fixes which postal code gets priced, so
    // this never affects area/rate accuracy, only instant-courier coverage.
    const geocodeQuery = [
      values.streetAddress,
      values.district,
      values.city,
      values.province,
      values.postalCode,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

    setIsLoadingRates(true);
    setShippingRates([]);
    setSelectedRateIndex(null);

    const result = await getCheckoutShippingRates(
      { areaId: values.areaId, geocodeQuery },
      cart.lines.map((line) => ({ id: line.id, quantity: line.quantity }))
    );

    setIsLoadingRates(false);

    if (!result.success) {
      setShippingRatesError(result.error);
      return;
    }

    setShippingRates(result.rates);
    setSelectedRateIndex(result.rates.length > 0 ? 0 : null);
    if (result.rates.length === 0) {
      setShippingRatesError("Tidak ada opsi pengiriman yang tersedia untuk alamat tersebut.");
    }
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Nama lengkap wajib diisi.";
    if (!values.phone.trim()) nextErrors.phone = "Nomor telepon wajib diisi.";
    if (!values.email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (!values.province.trim()) nextErrors.province = "Provinsi wajib diisi.";
    if (!values.city.trim()) nextErrors.city = "Kota wajib diisi.";
    if (!values.district.trim()) nextErrors.district = "Kecamatan wajib diisi.";
    if (!values.areaId.trim()) nextErrors.postalCode = "Kode pos wajib dipilih.";
    if (!values.streetAddress.trim())
      nextErrors.streetAddress = "Alamat jalan wajib diisi.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (cart.lines.length === 0) {
      setSubmitError("Keranjang Anda kosong.");
      return;
    }
    if (!validate()) return;

    const selectedRate = selectedRateIndex !== null ? shippingRates[selectedRateIndex] : null;
    if (!selectedRate) {
      setSubmitError("Select a shipping option.");
      return;
    }

    setIsSubmitting(true);
    // placeOrder still expects a single combined shipping address string —
    // join the split fields together here without changing the checkout
    // schema or the server action.
    const address = [
      values.streetAddress.trim(),
      values.district.trim(),
      values.city.trim(),
      values.province.trim(),
      values.postalCode.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const result = await placeOrder(
      {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        address,
        notes: values.notes,
        shippingMethod: values.shippingMethod,
        courierCode: selectedRate.courierCode,
        courier: selectedRate.courier,
        service: selectedRate.service,
        shippingCost: selectedRate.cost,
        areaId: values.areaId,
      },
      cart.lines.map((line) => ({ id: line.id, quantity: line.quantity }))
    );

    if (!result.success) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    cart.clear();
    router.push(`/checkout/payment?order=${encodeURIComponent(result.orderNumber)}`);
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col">
          <section className="bg-paper py-10 sm:py-16 md:py-24">
            <Container className="flex flex-col items-center gap-6">
              <SectionHeading eyebrow="Belanja" title="Checkout" align="center" />
              <EmptyState message="Keranjang Anda kosong. Tambahkan produk sebelum checkout." />
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98]"
              >
                Lanjutkan Belanja
              </Link>
            </Container>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-10 sm:py-16 md:py-24">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <SectionHeading eyebrow="Belanja" title="Checkout" />

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:items-start"
            >
              {/* Left column: contact/delivery details + shipping */}
              <div className="flex flex-col gap-8">
                {/* Contact + shipping details */}
                <div className="flex flex-col gap-5 rounded-2xl border border-line p-5 shadow-xs sm:p-6">
                  <h2 className="font-serif text-lg font-semibold text-ink">
                    Detail Pengiriman
                  </h2>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Nama lengkap</span>
                  <input
                    value={values.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Nama Anda"
                    autoComplete="name"
                    className={INPUT_CLASS}
                  />
                  {errors.fullName ? (
                    <span className="text-xs text-signal">{errors.fullName}</span>
                  ) : null}
                </label>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Nomor telepon</span>
                    <input
                      type="tel"
                      value={values.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="08123456789"
                      autoComplete="tel"
                      className={INPUT_CLASS}
                    />
                    {errors.phone ? (
                      <span className="text-xs text-signal">{errors.phone}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Email</span>
                    <input
                      type="email"
                      value={values.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={INPUT_CLASS}
                    />
                    {errors.email ? (
                      <span className="text-xs text-signal">{errors.email}</span>
                    ) : null}
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Provinsi</span>
                    <select
                      value={values.provinceId}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      autoComplete="address-level1"
                      className={INPUT_CLASS}
                    >
                      <option value="">Pilih provinsi</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {errors.province ? (
                      <span className="text-xs text-signal">{errors.province}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Kota</span>
                    <select
                      value={values.cityId}
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={!values.provinceId}
                      autoComplete="address-level2"
                      className={INPUT_CLASS}
                    >
                      <option value="">Pilih kota/kabupaten</option>
                      {regencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.city ? (
                      <span className="text-xs text-signal">{errors.city}</span>
                    ) : null}
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Kecamatan</span>
                    <select
                      value={values.districtId}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!values.cityId}
                      autoComplete="address-level3"
                      className={INPUT_CLASS}
                    >
                      <option value="">Pilih kecamatan</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.district ? (
                      <span className="text-xs text-signal">{errors.district}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL_CLASS}>Kode pos</span>
                    <select
                      value={values.areaId}
                      onChange={(e) => handlePostalChange(e.target.value)}
                      disabled={!values.districtId || isLoadingPostal}
                      autoComplete="postal-code"
                      className={INPUT_CLASS}
                    >
                      <option value="">{isLoadingPostal ? "Memuat…" : "Pilih kode pos"}</option>
                      {postalOptions.map((o) => (
                        <option key={`${o.areaId}-${o.postalCode}`} value={o.areaId}>
                          {o.postalCode} — {o.label}
                        </option>
                      ))}
                    </select>
                    {postalError ? (
                      <span className="text-xs text-signal">{postalError}</span>
                    ) : null}
                    {errors.postalCode ? (
                      <span className="text-xs text-signal">{errors.postalCode}</span>
                    ) : null}
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Alamat jalan</span>
                  <textarea
                    value={values.streetAddress}
                    onChange={(e) => update("streetAddress", e.target.value)}
                    placeholder="Nama jalan, gedung, nomor rumah"
                    rows={3}
                    autoComplete="street-address"
                    className={INPUT_CLASS}
                  />
                  {errors.streetAddress ? (
                    <span className="text-xs text-signal">{errors.streetAddress}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={LABEL_CLASS}>Catatan (opsional)</span>
                  <textarea
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Instruksi pengiriman, catatan hadiah, dll."
                    rows={3}
                    className={INPUT_CLASS}
                  />
                </label>

              </div>

              {/* Shipping */}
              <div className="flex flex-col gap-4 rounded-2xl border border-line p-5 shadow-xs sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Pengiriman
                </h2>

                <button
                  type="button"
                  onClick={handleCalculateShipping}
                  disabled={isLoadingRates}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-cloud/60 px-3.5 py-3 text-sm font-medium text-ink transition-all duration-200 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5"
                >
                  {isLoadingRates ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  ) : null}
                  {isLoadingRates ? "Menghitung…" : "Hitung Ongkir"}
                </button>

                {shippingRatesError ? (
                  <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
                    {shippingRatesError}
                  </p>
                ) : null}

                {shippingRates.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {shippingRates.map((rate, index) => (
                      <label
                        key={`${rate.courierCode}-${rate.service}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-200 ${
                          selectedRateIndex === index
                            ? "border-signal/50 bg-signal/5"
                            : "border-line bg-cloud/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingRate"
                          value={index}
                          checked={selectedRateIndex === index}
                          onChange={() => setSelectedRateIndex(index)}
                          className="mt-1"
                        />
                        <span className="flex flex-1 items-start justify-between gap-3">
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-ink">
                              {rate.courier} · {rate.service}
                            </span>
                            <span className="text-xs text-slate">{rate.eta}</span>
                          </span>
                          <span className="font-mono text-sm text-ink">
                            {formatCurrency(rate.cost, rate.currency)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}

                {submitError ? (
                  <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-signal">
                    {submitError}
                  </p>
                ) : null}
              </div>
              </div>

              {/* Order summary */}
              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-cloud/40 p-5 shadow-xs sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Ringkasan Pesanan
                </h2>

                <ul className="flex flex-col gap-3 border-b border-line pb-4">
                  {cart.lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-ink">
                        {line.name}{" "}
                        <span className="text-slate">× {line.quantity}</span>
                      </span>
                      <span className="font-mono text-ink">
                        {formatCurrency(line.price * line.quantity, line.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">
                    Subtotal ({cart.count} {cart.count === 1 ? "produk" : "produk"})
                  </span>
                  <span className="font-mono text-base font-medium text-ink">
                    {formatCurrency(cart.subtotal, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="font-medium text-ink">Total</span>
                  <span className="font-mono text-base font-semibold text-ink">
                    {formatCurrency(cart.subtotal, currency)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate">
                  Anda akan membayar melalui transfer bank di halaman berikutnya dan
                  mengunggah bukti pembayaran di sana.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-ink/85 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  ) : null}
                  {isSubmitting ? "Memproses pesanan…" : "Buat Pesanan"}
                </button>
              </div>
            </form>
          </Container>
        </section>
      </main>
    </div>
  );
}
