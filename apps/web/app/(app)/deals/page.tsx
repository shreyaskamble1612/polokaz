import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { MOCK_DEALS } from "@/lib/mock-deals";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function DealsPage() {
  await requireServerSession();

  return <DealsBrowser deals={MOCK_DEALS} />;
}
