import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-medium tracking-[0.24em] uppercase text-cyan-300/80">Loading Customer Dashboard...</p>
      </div>
    </div>
  );
}
