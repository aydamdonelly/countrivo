export function GamePlayLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="h-5 w-16 skeleton rounded" />
        <div className="h-5 w-28 skeleton rounded" />
      </div>
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton rounded-lg mx-auto" />
        <div className="rounded-2xl bg-surface-elevated h-64 sm:h-80 skeleton" />
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-24 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
