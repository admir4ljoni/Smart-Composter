import { clockTime } from '@/lib/composter';
import { cn } from '@/lib/utils';

/**
 * "Live" chip whose ring empties over the poll interval, so people can see
 * when the next refresh lands.
 */
export function LiveIndicator({
    now,
    period = 10,
    className,
}: {
    now: number;
    period?: number;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft',
                className,
            )}
        >
            <svg viewBox="0 0 20 20" aria-hidden className="size-4 -rotate-90">
                <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="2.5"
                />
                <circle
                    key={now}
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray="100"
                    className="refresh-ring"
                    style={{ ['--period' as string]: `${period}s` }}
                />
            </svg>
            <span>
                <span className="font-medium text-foreground">Langsung</span>,
                diperbarui <span className="tabular">{clockTime(now)}</span>
            </span>
        </span>
    );
}
