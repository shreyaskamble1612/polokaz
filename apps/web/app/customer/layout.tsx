import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server-session";

export default async function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("member");

  return children;
}
