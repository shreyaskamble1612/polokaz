export default function DealsLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#09090f_0%,#11111a_48%,#07070b_100%)] text-white px-4 py-16">
      <div className="mx-auto max-w-7xl space-y-8 animate-pulse">
        <div className="h-48 rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="h-10 w-96 bg-white/10 rounded mb-4" />
          <div className="h-14 w-full bg-white/5 rounded-full" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-48 bg-white/10 rounded" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="w-[280px] h-[200px] bg-white/5 border border-white/10 rounded-[20px] flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
