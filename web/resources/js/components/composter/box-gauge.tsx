import { useId } from 'react';
import type { CSSProperties } from 'react';
import { formatValue, heatColor, heatLevel } from '@/lib/composter';
import { cn } from '@/lib/utils';
import type { Status } from '@/types';

type Props = {
    tempCore: number | null;
    gas: number | null;
    status: Status;
    maxTemp: number;
    stirring?: boolean;
    /** Stagger for the one page-load moment (ms). */
    delay?: number;
    className?: string;
};

// Fixed bubble lanes so the picture is stable between renders.
const LANES = [
    { x: 44, y: 176, r: 2.4 },
    { x: 101, y: 168, r: 1.8 },
    { x: 63, y: 160, r: 2 },
    { x: 118, y: 180, r: 2.2 },
    { x: 52, y: 140, r: 1.6 },
    { x: 92, y: 150, r: 2.6 },
    { x: 108, y: 132, r: 1.7 },
    { x: 70, y: 182, r: 2.1 },
];

const PADDLES = [112, 130, 148, 166];

const CHAMBER_BOTTOM = 188;
const COMPOST_TOP = 92;

/**
 * Cut-away of the composter box. Compost glows with the core temperature,
 * gas bubbles rise faster and more often as the MQ-135 reading climbs,
 * and the auger spins while a stir command runs.
 */
export function BoxGauge({
    tempCore,
    gas,
    status,
    maxTemp,
    stirring = false,
    delay = 0,
    className,
}: Props) {
    const uid = useId();
    const offline = status === 'offline';
    const heat = heatColor(tempCore, maxTemp);
    const glowHeight =
        (CHAMBER_BOTTOM - COMPOST_TOP + 6) *
        Math.max(0.12, heatLevel(tempCore));
    const bubbles =
        offline || gas === null
            ? 0
            : Math.min(LANES.length, Math.max(1, Math.round(gas / 130)));
    const duration = gas === null ? 4 : Math.max(1.4, 4.2 - gas / 380);

    const label = offline
        ? 'Perangkat offline'
        : `Suhu inti ${formatValue(tempCore, 'temp_core')} °C, gas ${formatValue(gas, 'gas')} ppm`;

    return (
        <svg
            viewBox="0 0 160 226"
            role="img"
            aria-label={label}
            className={cn(
                'h-auto w-full overflow-visible transition-[filter,opacity] duration-700',
                offline && 'opacity-70 grayscale',
                className,
            )}
        >
            <defs>
                <linearGradient id={`${uid}-steel`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--steel)" />
                    <stop
                        offset="0.55"
                        stopColor="color-mix(in oklab, var(--steel) 70%, white)"
                    />
                    <stop offset="1" stopColor="var(--steel)" />
                </linearGradient>
                <linearGradient id={`${uid}-glow`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0" stopColor={heat} stopOpacity="0.95" />
                    <stop offset="0.7" stopColor={heat} stopOpacity="0.45" />
                    <stop offset="1" stopColor={heat} stopOpacity="0" />
                </linearGradient>
                <clipPath id={`${uid}-chamber`}>
                    <rect x="30" y="40" width="100" height="148" rx="3" />
                </clipPath>
            </defs>

            {/* legs */}
            <rect
                x="27"
                y="204"
                width="9"
                height="14"
                rx="1.5"
                fill="var(--steel-deep)"
            />
            <rect
                x="124"
                y="204"
                width="9"
                height="14"
                rx="1.5"
                fill="var(--steel-deep)"
            />

            {/* lid + handle */}
            <path
                d="M66 20 V11 H94 V20"
                fill="none"
                stroke="var(--steel-deep)"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <rect
                x="15"
                y="19"
                width="130"
                height="11"
                rx="3"
                fill="var(--steel-deep)"
            />

            {/* body */}
            <rect
                x="20"
                y="29"
                width="120"
                height="178"
                rx="4"
                fill={`url(#${uid}-steel)`}
                stroke="var(--steel-deep)"
                strokeWidth="1.5"
            />

            {/* chamber interior */}
            <rect
                x="30"
                y="40"
                width="100"
                height="148"
                rx="3"
                fill="color-mix(in oklab, var(--steel-deep) 55%, var(--humus))"
            />

            <g clipPath={`url(#${uid}-chamber)`}>
                <g className={cn(stirring && 'compost-churning')}>
                    <path
                        d="M26 94 Q42 86 58 92 T90 90 T134 92 V192 H26 Z"
                        fill="var(--humus)"
                    />
                    {/* heat glow rising from the bottom of the pile */}
                    <rect
                        key={offline ? 'off' : 'on'}
                        className="heat-rise"
                        x="26"
                        width="108"
                        fill={`url(#${uid}-glow)`}
                        style={
                            {
                                y: CHAMBER_BOTTOM - glowHeight,
                                height: glowHeight,
                                animationDelay: `${delay}ms`,
                                transition:
                                    'y 1s ease, height 1s ease, fill 1s ease',
                            } as CSSProperties
                        }
                    />
                    {/* texture: fixed crumbs of organic matter */}
                    {[
                        [40, 104],
                        [58, 118],
                        [96, 108],
                        [118, 122],
                        [48, 140],
                        [84, 132],
                        [110, 152],
                        [66, 166],
                        [38, 172],
                        [100, 178],
                    ].map(([cx, cy]) => (
                        <ellipse
                            key={`${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            rx="3"
                            ry="1.6"
                            fill="var(--humus-light)"
                            opacity="0.8"
                        />
                    ))}
                </g>

                {LANES.slice(0, bubbles).map((b, i) => (
                    <circle
                        key={i}
                        className="bubble"
                        cx={b.x}
                        cy={b.y}
                        r={b.r}
                        fill="none"
                        stroke="color-mix(in oklab, var(--steel) 80%, white)"
                        strokeWidth="1.1"
                        style={
                            {
                                '--dur': `${duration + (i % 3) * 0.6}s`,
                                '--delay': `${(i * duration) / bubbles}s`,
                                '--rise': `${-(b.y - 48)}px`,
                            } as CSSProperties
                        }
                    />
                ))}
            </g>

            {/* temperature probe (DS18B20) */}
            <line
                x1="118"
                y1="34"
                x2="118"
                y2="150"
                stroke="var(--steel-deep)"
                strokeWidth="2"
            />
            <circle
                cx="118"
                cy="152"
                r="4"
                fill={heat}
                stroke="var(--steel)"
                strokeWidth="1.5"
                style={{ transition: 'fill 1s ease' }}
            />

            {/* auger: T-handle, shaft, paddles */}
            <rect
                x="64"
                y="31"
                width="32"
                height="4"
                rx="2"
                fill="var(--steel-deep)"
            />
            <rect
                x="78.5"
                y="33"
                width="3"
                height="142"
                rx="1.5"
                fill="var(--steel-deep)"
            />
            <g className={cn(stirring && 'auger-turning')}>
                {PADDLES.map((y, i) => (
                    <rect
                        key={y}
                        x={i % 2 ? 80 : 66}
                        y={y}
                        width="14"
                        height="3.5"
                        rx="1.5"
                        fill="color-mix(in oklab, var(--steel) 85%, white)"
                        stroke="var(--steel-deep)"
                        strokeWidth="0.8"
                    />
                ))}
            </g>

            {/* leachate tap */}
            <path
                d="M140 192 H150 V199"
                fill="none"
                stroke="var(--steel-deep)"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <rect
                x="143"
                y="186"
                width="9"
                height="4"
                rx="1"
                fill="var(--heat-cool)"
            />
        </svg>
    );
}
