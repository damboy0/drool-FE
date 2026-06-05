export function UtilizationBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-red-500" : value >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="min-w-36">
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{value}%</span>
        <span>kink 70%</span>
      </div>
    </div>
  );
}
