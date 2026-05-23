<<<<<<< HEAD
import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server-session";
=======
import { authClient } from "@polokaz/auth/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
>>>>>>> e1197550e47072648d5127033b95fbe683207df5

import { AdminShell } from "./_components/admin-shell";

export default async function Layout({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  await requireRole("admin");

  return <AdminShell>{children}</AdminShell>;
}
=======
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
>>>>>>> e1197550e47072648d5127033b95fbe683207df5
