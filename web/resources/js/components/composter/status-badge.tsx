import { statusMeta } from '@/lib/composter';
import { cn } from '@/lib/utils';
import type { Status } from '@/types';

const TINT: Record<Status, string> = {
    normal: 'bg-ok/10 text-ok',
    peringatan: 'bg-warn/10 text-warn',
    offline: 'bg-offline/12 text-offline',
};

export function StatusBadge({
    status,
    className,
}: {
    status: Status;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                TINT[status],
                className,
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'size-1.5 rounded-full bg-current',
                    status === 'peringatan' && 'status-ping',
                )}
            />
            {statusMeta[status].label}
        </span>
    );
}
