export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Daily Hero skeleton */}
      <div className="py-8 sm:py-12">
        <div className="h-8 w-64 skeleton rounded-lg mb-4" />
        <div className="h-5 w-48 skeleton rounded-lg mb-6" />
        <div className="h-12 w-40 skeleton rounded-xl" />
      </div>

      {/* Featured game skeleton */}
      <section className="mb-8">
        <div className="h-5 w-48 skeleton rounded-lg mb-3" />
        <div className="rounded-2xl bg-surface-elevated p-5 sm:p-6 h-36 skeleton" />
      </section>

      {/* Leaderboard teaser skeleton */}
      <section className="mb-8 p-4 rounded-xl bg-surface-elevated border border-border">
        <div className="h-4 w-36 skeleton rounded-lg mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-white h-24 skeleton" />
          ))}
        </div>
      </section>

      {/* Games grid skeleton */}
      <section>
        <div className="h-5 w-40 skeleton rounded-lg mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-surface-elevated h-36 skeleton" />
          ))}
        </div>
      </section>
    </div>
  );
}
