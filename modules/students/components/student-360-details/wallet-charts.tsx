import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WalletBarItem = {
  name: string;
  short: string;
  payable: number;
  paid: number;
  due: number;
};

const SERIES_COLORS = {
  payable: "#60a5fa",
  paid: "#34d399",
  due: "#f87171",
} as const;

function rgba(hex: string, a: number) {
  // hex like #rrggbb
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function WalletBarsRecharts({
  recharts,
  data,
}: {
  recharts: typeof import("recharts");
  data: WalletBarItem[];
}) {
  const {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
  } = recharts;

  const isSingle = data.length <= 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={isSingle ? 10 : 6}
        barCategoryGap={isSingle ? "30%" : "20%"}
      >
        <defs>
          <linearGradient id="gradPayable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.payable} stopOpacity={0.95} />
            <stop offset="100%" stopColor={SERIES_COLORS.payable} stopOpacity={0.22} />
          </linearGradient>
          <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.paid} stopOpacity={0.95} />
            <stop offset="100%" stopColor={SERIES_COLORS.paid} stopOpacity={0.22} />
          </linearGradient>
          <linearGradient id="gradDue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS.due} stopOpacity={0.92} />
            <stop offset="100%" stopColor={SERIES_COLORS.due} stopOpacity={0.2} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis
          dataKey="short"
          tickLine={false}
          axisLine={false}
          padding={isSingle ? { left: 80, right: 80 } : { left: 20, right: 20 }}
        />
        <YAxis tickLine={false} axisLine={false} />

        <Tooltip
          cursor={{ fill: "transparent" }} // ✅ prevents grey overlay background
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          }}
          formatter={(v: unknown, key: unknown) => [
            `NPR ${Number(v).toFixed(2)}`,
            String(key),
          ]}
        />

        {/* ✅ Fix legend colors (no more black squares) */}
        <Legend
          formatter={(value: string) => (
            <span className="text-sm text-muted-foreground">{value}</span>
          )}
        />

        {/* ✅ Fixed: colors come from series gradients (legend matches) */}
        <Bar
          dataKey="due"
          name="Due"
          fill="url(#gradDue)"
          radius={[8, 8, 0, 0]}
          barSize={isSingle ? 90 : 40}
        />
        <Bar
          dataKey="paid"
          name="Paid"
          fill="url(#gradPaid)"
          radius={[8, 8, 0, 0]}
          barSize={isSingle ? 90 : 40}
        />
        <Bar
          dataKey="payable"
          name="Payable"
          fill="url(#gradPayable)"
          radius={[8, 8, 0, 0]}
          barSize={isSingle ? 90 : 40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WalletBarsFallback({ data }: { data: WalletBarItem[] }) {
  const sliced = data.slice(-6);

  const max = Math.max(1, ...sliced.map((x) => Math.max(x.payable, x.paid, x.due)));

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 gap-3">
        {sliced.map((x) => {
          const wPayable = Math.round((x.payable / max) * 100);
          const wPaid = Math.round((x.paid / max) * 100);
          const wDue = Math.round((x.due / max) * 100);

          return (
            <div
              key={x.short}
              className="rounded-xl border p-3 bg-gradient-to-br from-muted/40 to-background"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{x.name}</div>
                <Badge variant="other" label="BARS" />
              </div>

              <div className="mt-3 space-y-2">
                <MiniBar
                  label="Payable"
                  width={wPayable}
                  value={x.payable}
                  barColor={SERIES_COLORS.payable}
                />
                <MiniBar
                  label="Paid"
                  width={wPaid}
                  value={x.paid}
                  barColor={SERIES_COLORS.paid}
                />
                <MiniBar
                  label="Due"
                  width={wDue}
                  value={x.due}
                  barColor={SERIES_COLORS.due}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Tip: install <span className="font-mono">recharts</span> for a full bar chart.
      </div>
    </div>
  );
}

function MiniBar({
  label,
  width,
  value,
  barColor,
}: {
  label: string;
  width: number;
  value: number;
  barColor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 bg-muted overflow-hidden rounded">
        <div
          className={cn("h-full")}
          style={{
            width: `${width}%`,
            backgroundColor: rgba(barColor, 0.9),
          }}
        />
      </div>
      <div className="w-20 text-right text-xs text-muted-foreground tabular-nums">
        {value.toFixed(0)}
      </div>
    </div>
  );
}

export type { WalletBarItem };
