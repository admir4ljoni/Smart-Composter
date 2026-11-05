import { ArrowDownRight, ArrowUpRight, TriangleAlert } from 'lucide-react';
import { AnimatedNumber } from '@/components/composter/animated-number';
import { Sparkline } from '@/components/composter/sparkline';
import { formatValue, metricMeta, series, trend } from '@/lib/composter';
import { cn } from '@/lib/utils';
import type { Metric, Reading } from '@/types';

/** One reading with icon, change over the last hour and a 6 h sparkline. */
export function MetricTile({
    metric,
    value,
    readings,
    over = false,
    active = false,
    compact = false,
    onSelect,
    className,
}: {
    metric: Metric;
    value: number | null;
    readings: Reading[];
    over?: boolean;
    active?: boolean;
    compact?: boolean;
    onSelect?: () => void;
    className?: string;
}) {
    const meta = metricMeta[metric];
    const delta = trend(readings, metric);
    // Hide changes that round to zero at this metric's precision.
    const deltaText =
        delta === null ? null : formatValue(Math.abs(delta), metric);
    const showDelta = !compact && deltaText !== null && /[1-9]/.test(deltaText);
    const Icon = meta.icon;
    const Tag = onSelect ? 'button' : 'div';

    return (
        <Tag
            type={onSelect ? 'button' : undefined}
            onClick={onSelect}
            aria-pressed={onSelect ? active : undefined}
            className={cn(
                'flex min-w-0 flex-col rounded-xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200',
                compact ? 'gap-2 p-3' : 'gap-3 p-4',
                onSelect &&
                    'hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                active && 'border-brand ring-2 ring-brand/15',
                over && 'border-warn/40 bg-warn/5',
                className,
            )}
        >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand',
                        compact && 'hidden sm:flex',
                        over && 'bg-warn/10 text-warn',
                    )}
                >
                    {over ? (
                        <TriangleAlert className="size-3.5" />
                    ) : (
                        <Icon className="size-3.5" />
                    )}
                </span>
                <span className={cn(!compact && 'truncate')}>{meta.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <AnimatedNumber
                    value={value}
                    metric={metric}
                    className={cn(
                        'font-semibold tracking-tight',
                        compact ? 'text-xl' : 'text-2xl',
                        over && 'text-warn',
                    )}
                />
                <span className="text-sm text-muted-foreground">
                    {meta.unit}
                </span>
                {showDelta && (
                    <span
                        className="tabular ml-auto inline-flex items-center text-xs text-muted-foreground"
                        title="Perubahan dalam 1 jam terakhir"
                    >
                        {delta! > 0 ? (
                            <ArrowUpRight className="size-3.5" />
                        ) : (
                            <ArrowDownRight className="size-3.5" />
                        )}
                        {deltaText}
                    </span>
                )}
            </div>
            <Sparkline
                values={series(readings, metric)}
                color={over ? 'var(--warn)' : 'var(--brand)'}
                className={compact ? 'h-6' : undefined}
            />
        </Tag>
    );
}
