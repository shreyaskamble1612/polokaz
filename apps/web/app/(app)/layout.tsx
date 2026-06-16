import { ReactNode } from "react";
import { ClientHeader } from "@/components/layout/home/client-header";


export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <ClientHeader />
      {children}
    </main>
  );
}

