import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ParameterTrend } from "../../../api/types/trends.ts";
import { formatDayMonth, formatLongDate, formatShortDate, toDate, toDateKey } from "../../../utils/date.ts";
import "./TrendCell.css";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Which result dates get a label under the chart: all of them when there are few,
 *  otherwise the first, the last and three evenly picked in between (so labels never overlap). */
function pickAxisTicks(times: number[]): number[] {
  if (times.length <= 5) return times;
  const picks = [0, 0.25, 0.5, 0.75, 1].map((f) => times[Math.round(f * (times.length - 1))]);
  return Array.from(new Set(picks));
}

const dateKeyOf = (time: number) => toDateKey(new Date(time));

interface TrendCellProps {
  param: ParameterTrend;
  color: string;
  onRemove?: () => void; // only charts added from the dropdown can be removed
}

export default function TrendCell({ param, color, onRemove }: TrendCellProps) {
  const points = param.points;

  // The horizontal axis is real time: the chart starts at the first result date and ends at
  // the last one, and every result sits at its own date.
  const chartData = points.map((p) => ({ time: toDate(p.date).getTime(), value: p.value }));
  const times = Array.from(new Set(chartData.map((d) => d.time))).sort((a, b) => a - b);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  // With a single result there is no span, so give the dot a window around it.
  const timeDomain: [number, number] =
    firstTime === lastTime ? [firstTime - 15 * DAY_MS, firstTime + 15 * DAY_MS] : [firstTime, lastTime];

  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.25 || dataMax * 0.1 || 1;

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last && prev ? last.value - prev.value : null;

  let tone: "good" | "warn" | "bad" | "flat" = "flat";
  if (delta !== null && Math.abs(delta) > 1e-9) {
    const improving = param.higher_is_worse ? delta < 0 : delta > 0;
    tone = improving ? "good" : param.is_out_of_range ? "bad" : "warn";
  }

  const gradientId = `grad-${param.key}`;

  return (
    <div className="trend-cell">
      <div className="trend-top">
        <span className="trend-label">{param.label}</span>
        <div className="trend-top-right">
          {delta !== null && (
            <span className={`trend-delta trend-delta-${tone}`}>
              {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(delta).toFixed(Math.min(param.decimals, 1))}
            </span>
          )}
          {onRemove && (
            <button type="button" className="trend-remove" aria-label="Отстрани го графикот" onClick={onRemove}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="trend-value-row">
        <span className={`trend-value ${param.is_out_of_range ? "trend-value-alert" : ""}`}>
          {param.latest_value?.toFixed(param.decimals) ?? "—"}
        </span>
        <span className="trend-unit">{param.unit}</span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={timeDomain}
            ticks={pickAxisTicks(times)}
            interval="preserveStartEnd"
            minTickGap={10}
            tickFormatter={(time: number) =>
              time === firstTime || time === lastTime
                ? formatShortDate(dateKeyOf(time))
                : formatDayMonth(dateKeyOf(time))
            }
            tick={{ fontSize: 10, fill: "#9aa7b8" }}
            tickMargin={6}
            axisLine={false}
            tickLine={false}
            padding={{ left: 28, right: 28 }}
          />
          <YAxis
            hide
            scale={param.scale === "log" ? "log" : "linear"}
            domain={[Math.max(0, dataMin - padding), dataMax + padding]}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e5eaf0", fontSize: 13 }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return [`${num.toFixed(param.decimals)} ${param.unit}`, param.label] as [
                string,
                string
              ];
            }}
            labelFormatter={(time) => formatLongDate(dateKeyOf(Number(time)))}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: "#fff", stroke: color, strokeWidth: 1.8 }}
            activeDot={{ r: 5, fill: "#fff", stroke: color, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
