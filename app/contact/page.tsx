import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Hubungi Kami — Lapiita Karya",
};

function WhatsAppIcon({ className, strokeWidth = 1.75 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 8.05 19.4L3 21z" />
      <path d="M8.5 9.5c0 3.5 2.5 6 6 6 .8 0 1-.5.9-1.1l-.3-1.3c-.1-.4-.5-.6-.9-.5l-1.2.4a5.3 5.3 0 0 1-3-3l.4-1.2c.1-.4-.1-.8-.5-.9l-1.3-.3c-.6-.1-1.1.1-1.1.9z" />
    </svg>
  );
}

const WHATSAPP_NUMBER = "6287811049055";

const DETAILS = [
  {
    icon: Mail,
    label: "Email",
    value: "Lapiitakaryaweb@gmail.com",
    href: "mailto:Lapiitakaryaweb@gmail.com",
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: "Chat via WhatsApp",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
  {
    icon: Clock,
    label: "Waktu respons",
    value: "Kami biasanya membalas dalam 1–2 hari kerja.",
    href: undefined,
  },
  {
    icon: MapPin,
    label: "Lokasi",
    value: "Lapas Kelas II A Jakarta",
    href: undefined,
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
                {DETAILS.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud text-ink">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate">
                        {label}
                      </span>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-sm text-ink transition-colors hover:text-signal"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-sm text-ink">{value}</span>
                      )}
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
