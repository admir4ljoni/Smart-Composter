import { useEffect, useRef, useState } from 'react';
import { formatValue } from '@/lib/composter';
import { cn } from '@/lib/utils';
import type { Metric } from '@/types';

const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A reading that counts up on first paint and tweens + flashes when a poll
 * brings a new value, so people notice what just changed.
 */
export function AnimatedNumber({
    value,
    metric,
    className,
}: {
    value: number | null;
    metric: Metric;
    className?: string;
}) {
    const [shown, setShown] = useState<number | null>(
        value === null ? null : 0,
    );
    const [flash, setFlash] = useState(0);
    // What is on screen right now, and the last prop we animated towards.
    // Both survive StrictMode's mount → unmount → mount.
    const onScreen = useRef(0);
    const prev = useRef<number | null | undefined>(undefined);

    useEffect(() => {
        const changed = prev.current !== undefined && prev.current !== value;
        prev.current = value;

        if (value === null || reducedMotion()) {
            onScreen.current = value ?? 0;
            setShown(value);

            return;
        }

        const start = onScreen.current;

        if (start === value) {
            setShown(value);

            return;
        }

        if (changed) {
            setFlash((f) => f + 1);
        }

        let raf = 0;
        const t0 = performance.now();
        const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / (changed ? 700 : 1100));
            onScreen.current = start + (value - start) * (1 - (1 - p) ** 3);
            setShown(onScreen.current);

            if (p < 1) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [value]);

    return (
        <span
            key={flash}
            className={cn(
                'tabular -mx-1 rounded px-1',
                flash > 0 && 'value-flash',
                className,
            )}
        >
            {formatValue(shown, metric)}
        </span>
    );
}
