"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "../../lib/api/client-fetch";

function JoinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || searchParams.get("code");
  const [status, setStatus] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!refCode) {
      setStatus("invalid");
      setErrorMsg("No referral code found in link.");
      const timer = setTimeout(() => {
        router.push("/sign-up/onboarding");
      }, 2000);
      return () => clearTimeout(timer);
    }

    async function validateCode() {
      try {
        const res = await clientFetch<{ valid: boolean }>(`/api/referral/validate/${refCode}`);
        if (res.valid) {
          setStatus("valid");
          router.push(`/sign-up/onboarding?referralId=${refCode}`);
        } else {
          setStatus("invalid");
          setErrorMsg("This referral link has expired or reached its maximum usage limit.");
          setTimeout(() => {
            router.push("/sign-up/onboarding");
          }, 3000);
        }
      } catch (err: any) {
        setStatus("invalid");
        setErrorMsg("Failed to validate referral link.");
        setTimeout(() => {
          router.push("/sign-up/onboarding");
        }, 3000);
      }
    }

    validateCode();
  }, [refCode, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-2xl font-bold text-amber-500">Verifying referral...</h2>
            <p className="text-zinc-400">Please wait while we validate your invitation link.</p>
          </div>
        )}
        {status === "valid" && (
          <div className="space-y-4">
            <div className="h-12 w-12 bg-green-500/20 text-green-400 flex items-center justify-center rounded-full mx-auto text-2xl animate-bounce">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-green-400">Invitation Valid!</h2>
            <p className="text-zinc-400">Redirecting you to onboarding...</p>
          </div>
        )}
        {status === "invalid" && (
          <div className="space-y-4">
            <div className="h-12 w-12 bg-red-500/20 text-red-400 flex items-center justify-center rounded-full mx-auto text-2xl">
              ✕
            </div>
            <h2 className="text-2xl font-bold text-red-400">Invalid Link</h2>
            <p className="text-zinc-400">{errorMsg}</p>
            <p className="text-xs text-zinc-500">Redirecting to standard signup in a moment...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <JoinRedirectContent />
    </Suspense>
  );
}
