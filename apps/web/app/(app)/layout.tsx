import { HomeHeader } from "@/components/layout/home/header";
import { authClient } from "@polokaz/auth/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (data?.session) {
    return (
      <main>
        <HomeHeader session={data} />
        {children}
      </main>
    );
  } else {
    redirect("/sign-in");
  }
}
