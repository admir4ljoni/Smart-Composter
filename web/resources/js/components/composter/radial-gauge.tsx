import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// 270° arc, open at the bottom: starts bottom-left (135°), ends bottom-right.
const ARC = 'M21.72 78.28 A40 40 0 1 1 78.28 78.28';

function point(fraction: number, r: number): [number, number] {
    const a = ((135 + 270 * fraction) * Math.PI) / 180;

    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
}

/**
 * Arc gauge. The filled arc sweeps in on mount and glides to new values;
 * an optional tick marks the threshold.
 */
export function RadialGauge({
    value,
    min,
    max,
    color,
    threshold,
    children,
    className,
}: {
    value: number | null;
    min: number;
    max: number;
    color: string;
    threshold?: number;
    children?: ReactNode;
    className?: string;
}) {
    const fraction =
        value === null
            ? 0
            : Math.min(1, Math.max(0, (value - min) / (max - min)));
    const tick =
        threshold === undefined ? null : (threshold - min) / (max - min);

    return (
        <div className={cn('relative aspect-square', className)}>
            <svg viewBox="0 0 100 100" aria-hidden className="size-full">
                <path
                    d={ARC}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                <path
                    d={ARC}
                    pathLength={100}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    className="ring-in"
                    style={{
                        strokeDasharray: `${fraction * 100} 100`,
                        transition:
                            'stroke-dasharray 1s cubic-bezier(.2,.8,.2,1), stroke 1s',
                    }}
                />
                {tick !== null && (
                    <line
                        x1={point(tick, 33)[0]}
                        y1={point(tick, 33)[1]}
                        x2={point(tick, 47)[0]}
                        y2={point(tick, 47)[1]}
                        stroke="var(--foreground)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        opacity="0.55"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </div>
    );
}
