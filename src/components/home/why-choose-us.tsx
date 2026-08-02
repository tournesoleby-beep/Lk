import { Leaf, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { Container } from "@/components/home/container";
import { SectionHeading } from "@/components/home/section-heading";

const features = [
  {
    icon: Truck,
    title: "Free shipping over Rp2.350.000",
    description: "On qualifying orders. Most arrive within 2–4 days.",
  },
  {
    icon: RotateCcw,
    title: "60-day returns",
    description: "Try it at home. If it's not right, send it back for free.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticity guaranteed",
    description: "Every piece verified before it ships. No exceptions.",
  },
  {
    icon: Leaf,
    title: "Responsibly made",
    description: "Traceable materials and fair-wage manufacturing, always.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-cloud py-24 sm:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Why shop with us"
          title="Built around trust, not gimmicks"
        />

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group flex flex-col gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-paper shadow-xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-signal/25 group-hover:shadow-sm">
                <Icon className="h-5 w-5 text-signal" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-medium text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-slate">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
