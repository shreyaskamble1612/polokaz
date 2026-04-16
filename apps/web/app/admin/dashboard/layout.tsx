import { ReactNode } from "react";
import { authClient } from "@polokaz/auth/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (session.data?.user.role === "admin") {
    return children;
  } else {
    redirect("/");
  }
}
