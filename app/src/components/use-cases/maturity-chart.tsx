"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MaturityChart({
  data
}: {
  data: Array<{ pathway: string; count: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="rgba(20, 34, 24, 0.08)" />
          <XAxis dataKey="pathway" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(220, 168, 87, 0.12)" }} />
          <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="var(--chart-1)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
