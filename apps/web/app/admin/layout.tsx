import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server-session";

import { AdminShell } from "./_components/admin-shell";

export default async function Layout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return <AdminShell>{children}</AdminShell>;
}
