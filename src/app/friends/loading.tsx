export default function FriendsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-32 skeleton rounded-lg mb-8" />

      {/* Search skeleton */}
      <div className="h-12 w-full skeleton rounded-xl mb-8" />

      {/* Friends list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated">
            <div className="w-9 h-9 rounded-full skeleton shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-28 skeleton rounded mb-1.5" />
              <div className="h-3 w-20 skeleton rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
