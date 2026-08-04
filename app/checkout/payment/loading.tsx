import { Container } from "@/components/home/container";

export default function CheckoutPaymentLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-10">
            <div className="flex max-w-2xl flex-col gap-4">
              <div className="h-3 w-16 animate-pulse rounded-full bg-cloud" />
              <div className="h-9 w-72 animate-pulse rounded-full bg-cloud" />
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
              <div className="h-96 w-full animate-pulse rounded-2xl border border-line bg-cloud/40" />
              <div className="h-48 w-full animate-pulse rounded-2xl border border-line bg-cloud/40" />
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
