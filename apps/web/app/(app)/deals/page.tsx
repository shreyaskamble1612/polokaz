import { requireServerSession } from "@/lib/auth/server-session";
import { DealsPageClient } from "./deals-page-client";

export default async function DealsPage() {
  await requireServerSession();

  return <DealsPageClient />;
}
