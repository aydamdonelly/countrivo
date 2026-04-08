export default function PublicProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full skeleton shrink-0" />
        <div className="flex-1">
          <div className="h-7 w-40 skeleton rounded-lg mb-2" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-elevated h-20 skeleton" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-elevated skeleton" />
        ))}
      </div>
    </div>
  );
}
