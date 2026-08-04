import { Container } from "@/components/home/container";

export default function ShopLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <section className="bg-paper py-16 sm:py-24">
          <Container className="flex flex-col gap-12">
            <div className="flex max-w-2xl flex-col gap-4">
              <div className="h-3 w-16 animate-pulse rounded-full bg-cloud" />
              <div className="h-9 w-64 animate-pulse rounded-full bg-cloud" />
              <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-cloud" />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-11 w-full max-w-sm animate-pulse rounded-full bg-cloud" />
              <div className="h-11 w-64 animate-pulse rounded-full bg-cloud" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col overflow-hidden rounded-2xl border border-line"
                >
                  <div className="aspect-[4/5] w-full animate-pulse bg-cloud" />
                  <div className="flex flex-col gap-2 px-4 py-4">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-cloud" />
                    <div className="h-4 w-1/3 animate-pulse rounded-full bg-cloud" />
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
