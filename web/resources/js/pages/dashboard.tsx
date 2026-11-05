import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, Radar, RotateCw, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@/components/composter/animated-number';
import { BoxGauge } from '@/components/composter/box-gauge';
import { LiveIndicator } from '@/components/composter/live-indicator';
import { MetricTile } from '@/components/composter/metric-tile';
import { RadialGauge } from '@/components/composter/radial-gauge';
import { Sparkline } from '@/components/composter/sparkline';
import { StatusBadge } from '@/components/composter/status-badge';
import { useStir } from '@/components/composter/use-stir';
import { Button } from '@/components/ui/button';
import {
    alertText,
    byAttention,
    deviceName,
    formatValue,
    greeting,
    heatColor,
    phase,
    schoolBadge,
    series,
    timeAgo,
} from '@/lib/composter';
import { cn } from '@/lib/utils';
import {
    schools,
    thresholds,
    useMockDevices,
    useMockRecent,
    useMockViewer,
} from '@/mock/composter';
import { dashboard } from '@/routes';
import { index as adminDevices } from '@/routes/admin/devices';
import { show } from '@/routes/devices';
import type { Device, Reading } from '@/types';

const MAX = thresholds.temp_core_max;

export default function Dashboard() {
    // ponytail: mock; slice 3.3 takes { devices, recent } props + usePoll(10_000).
    const { devices, now } = useMockDevices();
    const recent = useMockRecent(devices, now);
    const { role, school } = useMockViewer();
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Dasbor" />
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
                {role === 'superadmin' ? (
                    <Overview devices={devices} recent={recent} now={now} />
                ) : (
                    <SchoolView
                        userName={auth.user.name.split(' ')[0]}
                        schoolName={school?.name ?? ''}
                        devices={[...devices].sort(byAttention)}
                        recent={recent}
                        now={now}
                    />
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dasbor', href: dashboard() }],
};

function summary(devices: Device[], now: number): string {
    const issues = devices.filter((d) => d.status !== 'normal');

    if (devices.length === 0) {
        return 'Belum ada komposter yang terhubung.';
    }

    if (issues.length === 0) {
        return 'Semua komposter berjalan normal.';
    }

    if (issues.length > 1) {
        return `${issues.length} komposter perlu dicek.`;
    }

    const [d] = issues;

    return d.status === 'offline'
        ? `${deviceName(d)} tidak mengirim data sejak ${timeAgo(d.last_seen_at, now)}.`
        : `${deviceName(d)} perlu dicek: ${alertText(d.alerts).toLowerCase()}.`;
}

function average(values: (number | null | undefined)[]): number | null {
    const nums = values.filter((v): v is number => v != null);

    return nums.length
        ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1))
        : null;
}

/** Concentric "signal" rings: the boxes broadcast. Decorative. */
function SignalRings({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 200 200"
            className={cn('pointer-events-none text-brand', className)}
        >
            {[30, 55, 80, 105].map((r, i) => (
                <circle
                    key={r}
                    cx="200"
                    cy="0"
                    r={r * 1.6}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity={0.16 - i * 0.03}
                />
            ))}
        </svg>
    );
}

function Stat({
    label,
    children,
    warn = false,
}: {
    label: string;
    children: ReactNode;
    warn?: boolean;
}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd
                className={cn(
                    'tabular mt-1 text-2xl font-semibold tracking-tight',
                    warn && 'text-warn',
                )}
            >
                {children}
            </dd>
        </div>
    );
}

/* ================= School user ================= */

function SchoolView({
    userName,
    schoolName,
    devices,
    recent,
    now,
}: {
    userName: string;
    schoolName: string;
    devices: Device[];
    recent: Record<number, Reading[]>;
    now: number;
}) {
    const online = devices.filter((d) => d.status !== 'offline');
    const issues = devices.filter((d) => d.status !== 'normal').length;

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft md:p-8">
                <SignalRings className="absolute -top-6 -right-6 size-72" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-primary">
                        {schoolName}
                    </span>
                    <LiveIndicator now={now} />
                </div>
                <h1 className="relative mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                    {greeting(now)}, {userName}.{' '}
                    <span className="text-muted-foreground">
                        {summary(devices, now)}
                    </span>
                </h1>
                <dl className="relative mt-8 grid grid-cols-2 gap-6 border-t pt-6 sm:grid-cols-4">
                    <Stat label="Komposter">{devices.length}</Stat>
                    <Stat label="Mengirim data">
                        {online.length}/{devices.length}
                    </Stat>
                    <Stat label="Perlu dicek" warn={issues > 0}>
                        {issues}
                    </Stat>
                    <Stat label="Rata-rata suhu inti">
                        {formatValue(
                            average(online.map((d) => d.latest?.temp_core)),
                            'temp_core',
                        )}
                        <span className="ml-1 text-base font-normal text-muted-foreground">
                            °C
                        </span>
                    </Stat>
                </dl>
            </section>

            {devices.length === 0 ? (
                <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
                    Sekolah Anda belum punya komposter yang terdaftar. Hubungi
                    admin program untuk menautkan perangkat.
                </p>
            ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    {devices.map((d, i) => (
                        <DeviceCard
                            key={d.id}
                            device={d}
                            readings={recent[d.id] ?? []}
                            now={now}
                            index={i}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function DeviceCard({
    device,
    readings,
    now,
    index,
}: {
    device: Device;
    readings: Reading[];
    now: number;
    index: number;
}) {
    const r = device.latest;
    const temp = r?.temp_core ?? null;
    const { stir, running, remaining, cooldown, disabled } = useStir(device);

    return (
        <article className="flex flex-col rounded-2xl border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lift">
            <header className="flex items-start justify-between gap-4 p-5 pb-0 md:p-6 md:pb-0">
                <div className="min-w-0">
                    <Link
                        href={show(device.id)}
                        prefetch
                        className="text-lg font-semibold tracking-tight hover:text-primary focus-visible:underline focus-visible:outline-none"
                    >
                        {deviceName(device)}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {device.status === 'peringatan' &&
                            `${alertText(device.alerts)}. `}
                        Data terakhir {timeAgo(device.last_seen_at, now)}.
                    </p>
                </div>
                <StatusBadge status={device.status} />
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:p-6">
                <div className="flex items-end justify-center rounded-xl bg-gradient-to-b from-brand-soft to-transparent px-8 pt-6 pb-2">
                    <BoxGauge
                        tempCore={temp}
                        gas={r?.gas ?? null}
                        status={device.status}
                        maxTemp={MAX}
                        stirring={running}
                        delay={index * 160}
                        className="max-w-[8.5rem]"
                    />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                    <span className="text-sm text-muted-foreground">
                        Suhu inti
                    </span>
                    <div
                        className={cn(
                            'flex items-baseline gap-1',
                            device.alerts.includes('temp_core') && 'text-warn',
                        )}
                    >
                        <AnimatedNumber
                            value={temp}
                            metric="temp_core"
                            className="text-5xl font-semibold tracking-tight"
                        />
                        <span className="text-lg text-muted-foreground">
                            °C
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {phase(temp, MAX)}
                    </p>
                    <Sparkline
                        values={series(readings, 'temp_core')}
                        color={heatColor(temp, MAX)}
                        className="mt-4 h-12"
                    />
                    <span className="mt-1 text-xs text-muted-foreground">
                        6 jam terakhir
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 px-5 md:px-6">
                {(['temp_air', 'humidity', 'gas'] as const).map((m) => (
                    <MetricTile
                        key={m}
                        compact
                        metric={m}
                        value={r?.[m] ?? null}
                        readings={readings}
                        over={device.alerts.includes(m)}
                    />
                ))}
            </div>

            <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
                <Button
                    onClick={() => stir(30)}
                    disabled={disabled}
                    className="min-w-40"
                >
                    <RotateCw className={cn(running && 'animate-spin')} />
                    {running
                        ? `Mengaduk, ${remaining} detik`
                        : cooldown > 0
                          ? `Bisa lagi dalam ${cooldown} detik`
                          : 'Aduk 30 detik'}
                </Button>
                <Link
                    href={show(device.id)}
                    prefetch
                    className="group/link inline-flex items-center gap-1 rounded text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    Grafik dan pengaturan aduk
                    <ChevronRight className="size-4 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
            </footer>
        </article>
    );
}

/* ================= Superadmin ================= */

function Overview({
    devices,
    recent,
    now,
}: {
    devices: Device[];
    recent: Record<number, Reading[]>;
    now: number;
}) {
    const assigned = devices.filter((d) => d.school !== null);
    const unassigned = devices.length - assigned.length;
    const online = assigned.filter((d) => d.status !== 'offline');
    const attention = assigned
        .filter((d) => d.status !== 'normal')
        .sort(byAttention);
    const bySchool = schools
        .map((s) => ({
            school: s,
            devices: assigned
                .filter((d) => d.school?.id === s.id)
                .sort(byAttention),
        }))
        .filter((g) => g.devices.length > 0)
        .sort((a, b) => byAttention(a.devices[0], b.devices[0]));

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary">
                        Semua sekolah
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                        {summary(assigned, now)}
                    </h1>
                </div>
                <LiveIndicator now={now} />
            </header>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft">
                    <RadialGauge
                        value={online.length}
                        min={0}
                        max={assigned.length || 1}
                        color="var(--brand)"
                        className="w-20 shrink-0"
                    >
                        <span className="tabular text-lg font-semibold">
                            {online.length}/{assigned.length}
                        </span>
                    </RadialGauge>
                    <div>
                        <div className="font-medium">Mengirim data</div>
                        <p className="text-sm text-muted-foreground">
                            Komposter yang melapor dalam 5 menit terakhir.
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        'rounded-2xl border bg-card p-5 shadow-soft',
                        attention.length > 0 && 'border-warn/30 bg-warn/5',
                    )}
                >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TriangleAlert className="size-4 text-warn" />
                        Perlu dicek
                    </div>
                    <div
                        className={cn(
                            'tabular mt-2 text-4xl font-semibold tracking-tight',
                            attention.length > 0 && 'text-warn',
                        )}
                    >
                        {attention.length}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                        {attention.length
                            ? attention.map(deviceName).join(', ')
                            : 'Tidak ada yang perlu dicek.'}
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-soft">
                    <div className="text-sm text-muted-foreground">
                        Sekolah aktif
                    </div>
                    <div className="tabular mt-2 text-4xl font-semibold tracking-tight">
                        {bySchool.length}
                        <span className="text-lg font-normal text-muted-foreground">
                            /{schools.length}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sekolah yang punya komposter terpasang.
                    </p>
                </div>

                <div className="flex flex-col rounded-2xl border border-brand/30 bg-brand-soft p-5 shadow-soft">
                    <div className="flex items-center gap-2 text-sm text-accent-foreground">
                        <span className="relative flex size-4 items-center justify-center">
                            {unassigned > 0 && (
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/40 motion-reduce:hidden" />
                            )}
                            <Radar className="relative size-4" />
                        </span>
                        Perangkat baru
                    </div>
                    <div className="tabular mt-2 text-4xl font-semibold tracking-tight">
                        {unassigned}
                    </div>
                    {unassigned > 0 ? (
                        <Button
                            asChild
                            size="sm"
                            className="mt-auto self-start"
                        >
                            <Link href={adminDevices()}>
                                Tetapkan ke sekolah
                            </Link>
                        </Button>
                    ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Semua perangkat sudah punya sekolah.
                        </p>
                    )}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border bg-card shadow-soft">
                    <h2 className="px-6 pt-5 font-semibold">Perlu perhatian</h2>
                    {attention.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                            Semua komposter berjalan normal.
                        </p>
                    ) : (
                        <ul className="mt-2 divide-y">
                            {attention.map((d) => (
                                <li key={d.id}>
                                    <AttentionRow device={d} now={now} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <TemperatureSpread devices={online} />
            </section>

            <section>
                <h2 className="text-lg font-semibold tracking-tight">
                    Per sekolah
                </h2>
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {bySchool.map((g) => (
                        <SchoolCard
                            key={g.school.id}
                            name={g.school.name}
                            devices={g.devices}
                            recent={recent}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

function AttentionRow({ device, now }: { device: Device; now: number }) {
    const offline = device.status === 'offline';

    return (
        <Link
            href={show(device.id)}
            prefetch
            className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
        >
            <span
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    offline
                        ? 'bg-offline/12 text-offline'
                        : 'bg-warn/10 text-warn',
                )}
            >
                <TriangleAlert className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                    <span className="truncate font-medium">
                        {deviceName(device)}
                    </span>
                    <StatusBadge status={device.status} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                    {device.school?.name}.{' '}
                    {offline
                        ? `Tidak ada data sejak ${timeAgo(device.last_seen_at, now)}.`
                        : `${alertText(device.alerts)}.`}
                </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}

const BANDS = [
    { from: 15, to: 25, color: 'var(--heat-cool)' },
    { from: 25, to: 40, color: 'var(--heat-meso)' },
    { from: 40, to: MAX, color: 'var(--heat-thermo)' },
    { from: MAX, to: 75, color: 'var(--heat-hot)' },
];
const pct = (t: number) => ((Math.min(75, Math.max(15, t)) - 15) / 60) * 100;

/** Every online box on one temperature scale, so outliers stand out. */
function TemperatureSpread({ devices }: { devices: Device[] }) {
    const placed = devices.filter((d) => d.latest?.temp_core != null);

    return (
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Sebaran suhu inti</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Tiap titik satu komposter. Zona hijau dan kuning adalah suhu
                penguraian yang baik; garis putus-putus batas {MAX} °C.
            </p>

            <div className="relative mt-8 h-28">
                <div className="absolute inset-x-0 top-0 bottom-6 flex overflow-hidden rounded-lg">
                    {BANDS.map((b) => (
                        <div
                            key={b.from}
                            style={{
                                width: `${pct(b.to) - pct(b.from)}%`,
                                backgroundColor: `color-mix(in oklab, ${b.color} 16%, transparent)`,
                            }}
                        />
                    ))}
                </div>
                <div
                    className="absolute top-0 bottom-6 border-l border-dashed border-foreground/40"
                    style={{ left: `${pct(MAX)}%` }}
                />
                {placed.map((d, i) => {
                    const t = d.latest!.temp_core!;
                    const label = `${deviceName(d)}, ${formatValue(t, 'temp_core')} °C`;

                    return (
                        <div
                            key={d.id}
                            className="group absolute -translate-x-1/2 transition-[left] duration-1000"
                            style={{
                                left: `${pct(t)}%`,
                                top: `${12 + (i % 3) * 22}px`,
                            }}
                        >
                            <span
                                tabIndex={0}
                                role="img"
                                aria-label={label}
                                className="block size-3.5 rounded-full ring-2 ring-card transition-transform group-hover:scale-125 focus-visible:scale-125 focus-visible:outline-none"
                                style={{ backgroundColor: heatColor(t, MAX) }}
                            />
                            <span
                                aria-hidden
                                className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
                <div className="tabular absolute inset-x-0 bottom-0 h-4 text-xs text-muted-foreground">
                    {[15, 25, 40, MAX, 75].map((t) => (
                        <span
                            key={t}
                            className="absolute -translate-x-1/2"
                            style={{ left: `${pct(t)}%` }}
                        >
                            {t}°
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SchoolCard({
    name,
    devices,
    recent,
}: {
    name: string;
    devices: Device[];
    recent: Record<number, Reading[]>;
}) {
    const issues = devices.filter((d) => d.status !== 'normal').length;

    return (
        <div className="rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-3 px-5 pt-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-[11px] font-semibold text-accent-foreground">
                    {schoolBadge(name)}
                </span>
                <div className="min-w-0">
                    <h3 className="truncate font-semibold">{name}</h3>
                    <p className="text-xs text-muted-foreground">
                        {devices.length} komposter
                        {issues > 0 && `, ${issues} perlu dicek`}
                    </p>
                </div>
            </div>
            <ul className="mt-4 divide-y border-t">
                {devices.map((d) => {
                    const temp = d.latest?.temp_core ?? null;

                    return (
                        <li key={d.id}>
                            <Link
                                href={show(d.id)}
                                prefetch
                                className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                        {deviceName(d)}
                                    </div>
                                    <StatusBadge
                                        status={d.status}
                                        className="mt-1 px-2 py-0.5"
                                    />
                                </div>
                                <Sparkline
                                    values={series(
                                        recent[d.id] ?? [],
                                        'temp_core',
                                    )}
                                    color={
                                        d.status === 'offline'
                                            ? 'var(--offline)'
                                            : heatColor(temp, MAX)
                                    }
                                />
                                <div
                                    className={cn(
                                        'text-right',
                                        d.alerts.includes('temp_core') &&
                                            'text-warn',
                                    )}
                                >
                                    <AnimatedNumber
                                        value={temp}
                                        metric="temp_core"
                                        className="font-semibold"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        °C
                                    </span>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
