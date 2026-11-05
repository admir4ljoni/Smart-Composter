import { useId } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { clockTime, formatValue, metricMeta } from '@/lib/composter';
import type { Metric } from '@/types';

export type ChartPoint = { t: number } & Record<Metric, number | null>;

const HOUR = 3_600_000;

/** One metric over the last 24 h, with its threshold line when it has one. */
export function MetricChart({
    metric,
    data,
    now,
    threshold,
    height = 280,
}: {
    metric: Metric;
    data: ChartPoint[];
    now: number;
    threshold?: number;
    height?: number;
}) {
    const id = useId();
    const meta = metricMeta[metric];
    const start = now - 24 * HOUR;
    const ticks = [0, 4, 8, 12, 16, 20, 24]
        .map((h) => Math.floor(start / HOUR) * HOUR + h * HOUR)
        .filter((t) => t >= start && t <= now);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 16, right: 12, bottom: 0, left: 0 }}
            >
                <defs>
                    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                        <stop
                            offset="0"
                            stopColor="var(--brand)"
                            stopOpacity={0.28}
                        />
                        <stop
                            offset="1"
                            stopColor="var(--brand)"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={[start, now]}
                    ticks={ticks}
                    tickFormatter={clockTime}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <YAxis
                    width={44}
                    tickCount={5}
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                {threshold !== undefined && (
                    <ReferenceLine
                        y={threshold}
                        ifOverflow="extendDomain"
                        stroke="var(--warn)"
                        strokeDasharray="5 5"
                        label={{
                            value: `Batas ${threshold} ${meta.unit}`,
                            position: 'insideTopRight',
                            fill: 'var(--warn)',
                            fontSize: 12,
                        }}
                    />
                )}
                <Tooltip
                    cursor={{
                        stroke: 'var(--brand)',
                        strokeWidth: 1,
                        strokeDasharray: '3 3',
                    }}
                    content={({ active, payload, label }) =>
                        active && payload?.length ? (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lift">
                                <div className="text-xs text-muted-foreground">
                                    Pukul {clockTime(Number(label))}
                                </div>
                                <div className="tabular mt-0.5 font-semibold">
                                    {formatValue(
                                        payload[0].value as number | null,
                                        metric,
                                    )}{' '}
                                    <span className="font-normal text-muted-foreground">
                                        {meta.unit}
                                    </span>
                                </div>
                            </div>
                        ) : null
                    }
                />
                <Area
                    key={metric}
                    dataKey={metric}
                    type="monotone"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    fill={`url(#${id})`}
                    activeDot={{
                        r: 5,
                        stroke: 'var(--card)',
                        strokeWidth: 2,
                        fill: 'var(--brand)',
                    }}
                    animationDuration={900}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
