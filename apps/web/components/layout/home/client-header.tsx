"use client";

import { authClient } from "@polokaz/auth/client";
import { HomeHeader } from "./header";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ClientHeader() {
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending || !session?.session) {
    return null;
  }

  if (pathname.startsWith("/merchant")) {
    return null;
  }

  return <HomeHeader session={session} />;
}
