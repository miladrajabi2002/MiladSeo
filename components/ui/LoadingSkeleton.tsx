"use client";

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: "var(--border)" }}
    />
  );
}

export function StatRowSkeleton({ cards = 5 }: { cards?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-base bg-bg-card p-4"
        >
          <Pulse className="h-3 w-16" />
          <Pulse className="mt-3 h-8 w-20" />
          <Pulse className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-base bg-bg-card">
      <div className="border-b border-border-base p-3">
        <Pulse className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border-base p-3 last:border-0">
          <Pulse className="h-4 w-1/3" />
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-10 rounded-full" />
          <Pulse className="h-4 w-12" />
          <Pulse className="h-6 w-14" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-base bg-bg-card p-5"
        >
          <Pulse className="h-6 w-40" />
          <Pulse className="mt-3 h-4 w-24" />
          <div className="mt-4 flex gap-6">
            <Pulse className="h-8 w-16" />
            <Pulse className="h-8 w-16" />
          </div>
          <Pulse className="mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border-base bg-bg-card p-5">
      <Pulse className="h-4 w-56" />
      <div className="mt-4 flex h-48 items-end gap-3">
        {[60, 80, 45, 70, 30, 20].map((h, i) => (
          <Pulse key={i} className="flex-1" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border-base bg-bg-card p-4"
        >
          <Pulse className="h-3 w-3 rounded-full" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-4 w-1/3" />
            <Pulse className="h-3 w-2/3" />
          </div>
          <Pulse className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
