export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero skeleton */}
      <div className="bg-gray-200 rounded-2xl h-28 mb-6 animate-pulse" />

      {/* Search skeleton */}
      <div className="bg-gray-200 rounded-xl h-11 mb-4 animate-pulse" />

      {/* Category tabs skeleton */}
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-full h-8 w-20 animate-pulse flex-shrink-0" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
            <div className="p-3.5 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="flex justify-between items-center mt-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
