import { requireServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function CustomerCouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireServerSession();

  const { id } = await params;
  redirect(`/deals/${id}`);
}
