"use client";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { formatCzk, MIN_RECORDS_FOR_TREND } from "@/lib/records";

export default function TrendChart({ trend, highlightId }) {
  const { group, points, enough } = trend;
  if (!enough) {
    return (
      <p className="muted small">
        Only {group.length} comparable sale{group.length === 1 ? "" : "s"} in this group. A trend is shown from{" "}
        {MIN_RECORDS_FOR_TREND} records.
      </p>
    );
  }
  const scatter = group.map((r) => ({
    x: Number(r.sale_date.slice(0, 4)) + (Number(r.sale_date.slice(5, 7)) - 1) / 12,
    y: r.price_czk,
    id: r.id,
  }));
  const highlighted = scatter.filter((p) => p.id === highlightId);
  const line = points.map((p) => ({ x: p.year + 0.5, median: p.median, count: p.count }));
  const minX = Math.floor(Math.min(...scatter.map((p) => p.x)));
  const maxX = Math.ceil(Math.max(...scatter.map((p) => p.x)));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="#eee" />
          <XAxis type="number" dataKey="x" domain={[minX, maxX]} tickFormatter={(v) => Math.floor(v)} allowDecimals={false} fontSize={11} />
          <YAxis type="number" tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} fontSize={11} width={40} />
          <Tooltip
            formatter={(value, name) => [formatCzk(value), name === "median" ? "Median of year" : "Sale"]}
            labelFormatter={(v) => `Year ${Math.floor(v)}`}
          />
          <Scatter data={scatter} dataKey="y" fill="#c9b79f" name="sale" />
          <Scatter data={highlighted} dataKey="y" fill="#000" name="sale" />
          <Line data={line} dataKey="median" stroke="#8a5a2b" strokeWidth={2} dot={{ r: 3 }} name="median" type="linear" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
