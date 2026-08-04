import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminProductsLoading() {
  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 w-full animate-pulse rounded-2xl border border-line bg-paper"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
