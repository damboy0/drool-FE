import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-900 p-5 shadow-sm">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-2xl font-semibold text-white">{value}</p>
        {children}
      </div>
      {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </section>
  );
}
