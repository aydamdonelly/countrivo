export default function LeaderboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="h-5 w-36 skeleton rounded-lg mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated">
            <div className="w-8 h-8 skeleton rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-24 skeleton rounded mb-1" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
            <div className="h-5 w-14 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
