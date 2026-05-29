import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-20 items-center justify-center rounded-[28px] border border-cyan-300/12 bg-cyan-500/10 text-cyan-200 shadow-[0_18px_40px_rgba(34,211,238,0.14)]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <p className="text-sm font-medium tracking-[0.24em] uppercase text-cyan-300/80">Loading Polokaz...</p>
      </div>
    </div>
  );
}
