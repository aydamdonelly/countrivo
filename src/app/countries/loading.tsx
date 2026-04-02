export default function CountriesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="h-5 w-64 skeleton rounded-lg mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-elevated skeleton" />
        ))}
      </div>
    </div>
  );
}
