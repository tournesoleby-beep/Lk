import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Hubungi Kami — Lapiita Karya",
};

const DETAILS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@lapiitakarya.com",
  },
  {
    icon: Clock,
    label: "Waktu respons",
    value: "Kami biasanya membalas dalam 1–2 hari kerja.",
  },
  {
    icon: MapPin,
    label: "Lokasi",
    value: "Studio kecil, mengirim ke seluruh Indonesia.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <SectionHeading
              eyebrow="Bantuan"
              title="Hubungi Kami"
              description="Pertanyaan tentang pesanan, produk, atau hal lainnya — kami senang mendengarnya."
            />

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
              <div className="flex flex-col gap-5">
                {DETAILS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud text-ink">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                        {label}
                      </span>
                      <span className="text-sm text-ink">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-line p-6 sm:p-8">
                <ContactForm />
              </div>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
