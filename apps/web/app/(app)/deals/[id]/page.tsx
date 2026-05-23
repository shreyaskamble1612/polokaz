import { DealDetailView } from "@/components/deals/DealDetailView";
import { MOCK_DEALS } from "@/lib/mock-deals";
import { notFound } from "next/navigation";

export default async function DealsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = MOCK_DEALS.find((entry) => entry.id === id);

  if (!deal) {
    notFound();
  }

  return (
    <DealDetailView
      deal={deal}
      collectionHref="/deals"
      collectionLabel="Deals"
    />
  );
}
