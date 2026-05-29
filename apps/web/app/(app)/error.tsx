"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-red-400">Something went wrong!</h2>
        <p className="text-zinc-400">{error.message || "Failed to load page. Please try again."}</p>
        <Button onClick={reset} className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200">
          Try again
        </Button>
      </div>
    </div>
  );
}
