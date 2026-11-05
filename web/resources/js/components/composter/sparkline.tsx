import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Tiny trend line that wipes in from the left on first paint. */
export function Sparkline({
    values,
    color = 'var(--brand)',
    className,
}: {
    values: number[];
    color?: string;
    className?: string;
}) {
    const id = useId();

    if (values.length < 2) {
        return <div className={cn('h-8', className)} />;
    }

    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    const points = values.map((v, i) => [
        (i / (values.length - 1)) * 100,
        30 - ((v - min) / span) * 26,
    ]);
    const line = points
        .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
        .join(' ');

    return (
        <svg
            aria-hidden
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
            className={cn('reveal-x h-8 w-full overflow-visible', className)}
        >
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity="0.22" />
                    <stop offset="1" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${line} L100 32 L0 32 Z`} fill={`url(#${id})`} />
            <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth="1.75"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
