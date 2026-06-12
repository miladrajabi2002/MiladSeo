"use client";

import { Bar, BarChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  /** Position values, oldest first. Lower position = better rank. */
  data: number[];
}

export default function Sparkline({ data }: SparklineProps) {
  if (data.length === 0) {
    return <span className="text-xs text-text-muted">–</span>;
  }

  const points = data.slice(-7);
  const first = points[0];
  const last = points[points.length - 1];
  // Lower position is better, so a falling value means improvement
  const color =
    last < first ? "#2ea043" : last > first ? "#f85149" : "#58a6ff";

  const max = Math.max(...points);
  // Invert so better positions render as taller bars
  const chartData = points.map((p, i) => ({
    i,
    value: Math.max(max - p + 1, 0.5),
  }));

  return (
    <div style={{ width: 60, height: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Bar
            dataKey="value"
            fill={color}
            radius={[1, 1, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
