import { requireServerSession } from "@/lib/auth/server-session";
import { DealDetailClient } from "./deal-detail-client";

export default async function DealsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireServerSession();
  const { id } = await params;
  return <DealDetailClient id={id} />;
}
