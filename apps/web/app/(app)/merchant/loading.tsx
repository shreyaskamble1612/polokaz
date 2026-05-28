import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f1f8ff_0%,#f8fafc_44%,#ffffff_100%)] text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-medium tracking-[0.24em] uppercase text-blue-700">Loading Merchant Command Center...</p>
      </div>
    </div>
  );
}
