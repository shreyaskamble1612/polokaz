"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function CookieTrackerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralId = searchParams.get("referralId") || searchParams.get("ref") || searchParams.get("code");
    const tdclid = searchParams.get("tdclid");

    const secureFlag = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

    if (referralId) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      document.cookie = `polokaz_ref=${referralId}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax${secureFlag}`;
      console.log("[CookieTracker] Saved polokaz_ref cookie:", referralId);
    }

    if (tdclid) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      document.cookie = `polokaz_tdclid=${tdclid}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax${secureFlag}`;
      console.log("[CookieTracker] Saved polokaz_tdclid cookie:", tdclid);
    }
  }, [searchParams]);

  return null;
}

export function CookieTracker() {
  return (
    <Suspense fallback={null}>
      <CookieTrackerContent />
    </Suspense>
  );
}
