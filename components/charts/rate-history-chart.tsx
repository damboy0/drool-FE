"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRateHistory } from "@/hooks/use-market-data";

export function RateHistoryChart({
  marketId,
  days = 90,
  lockedRate,
}: {
  marketId: string;
  days?: number;
  lockedRate?: number;
}) {
  const { data = [] } = useRateHistory(marketId, days);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#64748b"
            tickFormatter={(value) => new Date(value * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            tickLine={false}
          />
          <YAxis stroke="#64748b" unit="%" tickLine={false} width={42} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }}
            labelFormatter={(value) => new Date(Number(value) * 1000).toLocaleString()}
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              return [`${numericValue.toFixed(2)}%`, name === "floatingRate" ? "Floating" : "Fixed"];
            }}
          />
          {lockedRate ? (
            <ReferenceLine
              y={lockedRate}
              stroke="#38bdf8"
              strokeDasharray="5 5"
              label={{ value: "Your fixed rate", fill: "#38bdf8", fontSize: 12 }}
            />
          ) : null}
          <Line type="monotone" dataKey="floatingRate" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="fixedRate" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
