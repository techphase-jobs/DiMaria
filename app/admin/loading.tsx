export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-56 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
    </div>
  )
}
