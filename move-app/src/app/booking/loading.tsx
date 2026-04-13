export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-8 bg-muted rounded-full" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="flex justify-between">
        <div className="h-10 w-24 bg-muted rounded-lg" />
        <div className="h-10 w-24 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
