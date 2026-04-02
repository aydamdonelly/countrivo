export default function GamesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="h-5 w-72 skeleton rounded-lg mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-elevated h-40 skeleton" />
        ))}
      </div>
    </div>
  );
}
