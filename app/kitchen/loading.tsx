export default function KitchenLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-56 mb-5" />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
