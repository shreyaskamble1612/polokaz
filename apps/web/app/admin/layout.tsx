import { authClient } from "@polokaz/auth/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { AdminShell } from "./_components/admin-shell";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.session) {
    redirect("/sign-in");
  }

  if (session.data.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}