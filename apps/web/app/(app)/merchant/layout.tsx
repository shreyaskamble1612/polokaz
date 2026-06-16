import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server-session";
import { MerchantShell } from "./_components/merchant-shell";

export default async function MerchantLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("merchant");

  return <MerchantShell>{children}</MerchantShell>;
}
