export default function DealDetailLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.11),transparent_24%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-white/10 rounded" />
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 space-y-6">
          <div className="h-[300px] bg-white/5 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-1/4 bg-white/10 rounded" />
            <div className="h-20 bg-white/5 rounded-xl" />
          </div>
          <div className="h-12 w-full bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
