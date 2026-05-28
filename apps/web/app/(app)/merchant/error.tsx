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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef2f2_0%,#fff5f5_44%,#ffffff_100%)] text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-red-600">Something went wrong!</h2>
        <p className="text-slate-600">{error.message || "Failed to load merchant center. Please try again."}</p>
        <Button onClick={reset} className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
          Try again
        </Button>
      </div>
    </div>
  );
}
