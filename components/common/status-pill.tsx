import { cn } from "@/lib/utils";
import type { MarginHealth } from "@/types";

const styles: Record<MarginHealth, string> = {
  healthy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  "at-risk": "border-orange-400/30 bg-orange-400/10 text-orange-300",
  danger: "border-red-400/30 bg-red-400/10 text-red-300",
};

export function StatusPill({ status, className }: { status: MarginHealth; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize", styles[status], className)}>
      {status.replace("-", " ")}
    </span>
  );
}
