import { HomeHeader } from "@/components/layout/home/header";
import { getServerSession } from "@/lib/auth/server-session";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <main className="min-h-screen">
      {session?.session ? <HomeHeader session={session} /> : null}
      {children}
    </main>
  );
}
