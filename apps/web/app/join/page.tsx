"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "../../lib/api/client-fetch";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function JoinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || searchParams.get("code");
  const [status, setStatus] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!refCode) {
      setStatus("invalid");
      setErrorMsg("No referral code was found in the link.");
      return;
    }

    async function validateAndLogClick() {
      try {
        // Call the click logging API endpoint
        const res = await clientFetch<{ valid: boolean }>(`/api/referral/click?ref=${refCode}`);
        
        if (res && res.valid) {
          // Set 30-day cookie
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          document.cookie = `polokaz_ref=${refCode}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax; Secure`;

          setStatus("valid");
          // Redirect after a brief moment to show success
          setTimeout(() => {
            router.push(`/sign-up/onboarding?referralId=${refCode}`);
          }, 1500);
        } else {
          setStatus("invalid");
          setErrorMsg("This invite code is invalid, expired, or has reached its maximum uses.");
        }
      } catch (err: any) {
        setStatus("invalid");
        setErrorMsg("Failed to validate invitation link. Please check your network.");
      }
    }

    validateAndLogClick();
  }, [refCode, router]);

  const handleContinueWithoutCode = () => {
    router.push("/sign-up/onboarding");
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@polokaz.com?subject=Referral%20Code%20Issue";
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6 overflow-hidden select-none">
      {/* Decorative Brand Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/10 to-yellow-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-amber-600/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative max-w-md w-full backdrop-blur-xl bg-zinc-900/40 border border-zinc-800/80 shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] rounded-3xl p-8 text-center"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 mb-3">
            <Sparkles className="h-6 w-6 text-zinc-950 stroke-[2]" />
          </div>
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Polokaz
          </span>
        </div>

        <AnimatePresence mode="wait">
          {status === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping opacity-75" />
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
                  Verifying Invitation
                </h2>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                  Please wait while we secure your referral status and set up your discount benefits.
                </p>
              </div>
            </motion.div>
          )}

          {status === "valid" && (
            <motion.div
              key="valid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-emerald-400">
                  Welcome to Polokaz!
                </h2>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                  Your invite code <code className="bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded font-mono text-xs">{refCode}</code> is valid. Redirecting you to sign up...
                </p>
              </div>
            </motion.div>
          )}

          {status === "invalid" && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="relative flex items-center justify-center w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <AlertCircle className="h-10 w-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-rose-500">
                  Invalid Link
                </h2>
                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                  {errorMsg}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800/60">
                <Button
                  onClick={handleContinueWithoutCode}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold tracking-tight shadow-md hover:shadow-lg transition duration-200"
                >
                  Continue Standard Sign Up
                  <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={handleContactSupport}
                    variant="outline"
                    className="flex-1 border-zinc-800 hover:bg-zinc-800/50 text-zinc-300"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Get Help
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1 border-zinc-800 hover:bg-zinc-800/50 text-zinc-300"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function JoinRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white select-none">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
      }
    >
      <JoinRedirectContent />
    </Suspense>
  );
}
