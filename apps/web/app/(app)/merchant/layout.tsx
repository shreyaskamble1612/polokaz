import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server-session";

export default async function MerchantLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("merchant");

  return children;
}
