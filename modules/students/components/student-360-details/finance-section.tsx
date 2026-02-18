import * as React from "react";
import { BadgeIndianRupee, Receipt } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toSentenceCase } from "@/utils/text-utils";
import { EmptyCenter } from "./shared";
import {
  WalletBarsFallback,
  WalletBarsRecharts,
  type WalletBarItem,
} from "./wallet-charts";

const PALETTE = ["#db0f19", "#0f9463", "#fbbf24", "#cf0d95", "#a78bfa", "#2269ee"];

function stableColor(name: string, palette = PALETTE) {
  const s = (name || "").toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/* ---------------- Pie ---------------- */

function FeeGroupPie({
  data,
  recharts,
}: {
  data: Array<{ name: string; value: number }>;
  recharts: typeof import("recharts") | null;
}) {
  if (!data?.length) return <EmptyCenter>No fee group data.</EmptyCenter>;
  if (!recharts) return <EmptyCenter>Chart unavailable.</EmptyCenter>;

  const { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } = recharts;

  const chartData = data.map((d) => {
    const label = toSentenceCase(d.name);
    return { ...d, name: label, _color: stableColor(label) };
  });

  return (
    <div className="h-full w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d._color} />
            ))}
          </Pie>
          <Tooltip cursor={false} />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm">{toSentenceCase(String(value))}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Progress (with dynamic colors) ---------------- */

function FeeGroupProgress({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (!data?.length) return <EmptyCenter>No fee group data.</EmptyCenter>;

  const total =
    data.reduce((acc, x) => acc + (Number(x.value) || 0), 0) || 1;

  const sorted = [...data].sort(
    (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)
  );

  return (
    <div className="space-y-4">
      {sorted.map((x) => {
        const v = Number(x.value) || 0;
        const pct = Math.round((v / total) * 100);
        const label = toSentenceCase(x.name);
        const color = stableColor(label);

        return (
          <div key={x.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">{label}</div>
              <div className="text-muted-foreground tabular-nums">
                {pct}% • {v.toLocaleString()}
              </div>
            </div>

            {/* shadcn Progress doesn't support color prop → use style override */}
            <div className="relative h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Section ---------------- */

export function Student360FinanceSection({
  walletBars,
  recharts,
  feeGroup,
}: {
  walletBars: WalletBarItem[];
  recharts: typeof import("recharts") | null;
  feeGroup: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Col 1: Bar graph */}
      <Card className="border-1 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeIndianRupee className="h-5 w-5" />
            Finance Overview
          </CardTitle>
          <CardDescription>
            Wallet trend per batch (Payable vs Paid vs Due).
          </CardDescription>
        </CardHeader>

        {/* ✅ same height as other cards */}
        <CardContent className="h-[340px]">
          {walletBars.length ? (
            recharts ? (
              <WalletBarsRecharts recharts={recharts} data={walletBars} />
            ) : (
              <WalletBarsFallback data={walletBars} />
            )
          ) : (
            <EmptyCenter>No wallet records found.</EmptyCenter>
          )}
        </CardContent>
      </Card>

      {/* Col 2: Pie chart */}
      <Card className="border-1 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Group Split
          </CardTitle>
          <CardDescription>Distribution of fees by group.</CardDescription>
        </CardHeader>

        {/* ✅ same height */}
        <CardContent className="h-[340px]">
          <FeeGroupPie data={feeGroup} recharts={recharts} />
        </CardContent>
      </Card>

      {/* Col 3: Progress */}
      <Card className="border-1 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Fee Group Progress</CardTitle>
          <CardDescription>Relative contribution by group.</CardDescription>
        </CardHeader>

        <CardContent className="h-[340px] overflow-auto pr-2">
          <FeeGroupProgress data={feeGroup} />
        </CardContent>
      </Card>
    </div>
  );
}
