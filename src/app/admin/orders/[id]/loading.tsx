import { Container } from "@/components/home/container";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminOrderDetailLoading() {
  return (
    <div className="min-h-screen bg-cloud/40 py-10">
      <Container className="flex flex-col gap-6">
        <AdminNav />
        <div className="h-4 w-28 animate-pulse rounded-full bg-cloud" />
        <div className="flex flex-col gap-4">
          <div className="h-24 w-full animate-pulse rounded-2xl border border-line bg-paper" />
          <div className="h-64 w-full animate-pulse rounded-2xl border border-line bg-paper" />
        </div>
      </Container>
    </div>
  );
}
