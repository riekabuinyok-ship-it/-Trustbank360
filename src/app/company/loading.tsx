export default function CompanyLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-surface-200 dark:bg-surface-800 rounded-lg w-48" />
      <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded-lg w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-surface-200 dark:bg-surface-800 rounded-xl"
          />
        ))}
      </div>
      <div className="h-64 bg-surface-200 dark:bg-surface-800 rounded-xl mt-4" />
    </div>
  )
}
