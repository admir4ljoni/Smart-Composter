import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@/components/composter/animated-number';
import { BoxGauge } from '@/components/composter/box-gauge';
import { heatColor, metricMeta, phase } from '@/lib/composter';
import { cn } from '@/lib/utils';
import { thresholds } from '@/mock/composter';
import type { Metric } from '@/types';

const MAX = thresholds.temp_core_max;

/**
 * Public-page box that slowly cycles through composting phases, with
 * floating reading chips around it.
 */
export function DemoBox({
    stirring = false,
    showReadout = true,
    className,
}: {
    stirring?: boolean;
    showReadout?: boolean;
    className?: string;
}) {
    // Time since mount, not the clock, so SSR and hydration render the same box.
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setElapsed((t) => t + 3000), 3000);

        return () => clearInterval(id);
    }, []);

    const wave = (period: number) => 0.5 + 0.5 * Math.sin(elapsed / period);
    const temp = Number((32 + 30 * wave(18_000)).toFixed(1));
    const gas = Math.round(260 + 520 * wave(11_000));
    const humidity = Math.round(78 + 10 * wave(23_000));

    return (
        <div className={cn('relative', className)}>
            <BoxGauge
                tempCore={temp}
                gas={gas}
                status="normal"
                maxTemp={MAX}
                stirring={stirring}
                delay={300}
            />
            {showReadout && (
                <>
                    <Chip
                        metric="temp_core"
                        value={temp}
                        dot={heatColor(temp, MAX)}
                        note={phase(temp, MAX).split(',')[0]}
                        className="top-[18%] -left-6 sm:-left-20"
                    />
                    <Chip
                        metric="gas"
                        value={gas}
                        className="top-[48%] -right-4 [animation-delay:-2s] sm:-right-16"
                    />
                    <Chip
                        metric="humidity"
                        value={humidity}
                        className="bottom-[12%] -left-2 [animation-delay:-3.5s] sm:-left-14"
                    />
                </>
            )}
        </div>
    );
}

function Chip({
    metric,
    value,
    dot = 'var(--brand)',
    note,
    className,
}: {
    metric: Metric;
    value: number;
    dot?: string;
    note?: ReactNode;
    className?: string;
}) {
    const meta = metricMeta[metric];

    return (
        <div
            className={cn(
                'float absolute rounded-xl border bg-card/95 px-3 py-2 shadow-lift backdrop-blur',
                className,
            )}
        >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                    className="size-1.5 rounded-full transition-colors duration-1000"
                    style={{ backgroundColor: dot }}
                />
                {meta.label}
            </div>
            <div className="text-lg font-semibold tracking-tight">
                <AnimatedNumber value={value} metric={metric} />
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {meta.unit}
                </span>
            </div>
            {note && (
                <div className="text-[11px] text-muted-foreground">{note}</div>
            )}
        </div>
    );
}
