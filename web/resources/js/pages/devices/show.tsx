import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { Check, Copy, RotateCw, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AnimatedNumber } from '@/components/composter/animated-number';
import { BoxGauge } from '@/components/composter/box-gauge';
import { LiveIndicator } from '@/components/composter/live-indicator';
import { MetricChart } from '@/components/composter/metric-chart';
import type { ChartPoint } from '@/components/composter/metric-chart';
import { MetricTile } from '@/components/composter/metric-tile';
import { RadialGauge } from '@/components/composter/radial-gauge';
import { StatusBadge } from '@/components/composter/status-badge';
import { useStir } from '@/components/composter/use-stir';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import {
    METRICS,
    alertText,
    deviceName,
    formatValue,
    heatColor,
    metricMeta,
    phase,
    series,
    timeAgo,
} from '@/lib/composter';
import { cn } from '@/lib/utils';
import { thresholds, useMockDevice, useMockViewer } from '@/mock/composter';
import { dashboard } from '@/routes';
import { show } from '@/routes/devices';
import type { Device, Metric, Reading } from '@/types';

const MAX = thresholds.temp_core_max;
const THRESHOLD: Partial<Record<Metric, number>> = {
    temp_core: MAX,
    gas: thresholds.gas_max,
};

export default function DeviceShow({ deviceId }: { deviceId: number }) {
    // ponytail: mock; slice 4.2 takes { device, readings } props + usePoll.
    const { device, readings, now } = useMockDevice(deviceId);
    const { role } = useMockViewer();
    const title = device ? deviceName(device) : 'Komposter';

    useEffect(() => {
        setLayoutProps({
            breadcrumbs: [
                { title: 'Dasbor', href: dashboard() },
                { title, href: show(deviceId) },
            ],
        });
    }, [title, deviceId]);

    if (!device) {
        return (
            <div className="mx-auto max-w-xl px-4 py-20 text-center">
                <Head title="Komposter tidak ditemukan" />
                <h1 className="text-2xl font-semibold tracking-tight">
                    Komposter ini tidak bisa dibuka
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Perangkat tidak ada atau bukan milik sekolah Anda. Ganti ke
                    pratinjau Superadmin untuk melihat semua perangkat.
                </p>
                <Button asChild className="mt-6">
                    <Link href={dashboard()}>Kembali ke dasbor</Link>
                </Button>
            </div>
        );
    }

    return (
        <DeviceView
            device={device}
            readings={readings}
            now={now}
            showSchool={role === 'superadmin'}
        />
    );
}

function DeviceView({
    device,
    readings,
    now,
    showSchool,
}: {
    device: Device;
    readings: Reading[];
    now: number;
    showSchool: boolean;
}) {
    const [metric, setMetric] = useState<Metric>('temp_core');
    const stirState = useStir(device);
    const lastSix = readings.slice(-72);

    return (
        <>
            <Head title={deviceName(device)} />
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
                <DeviceHeader
                    device={device}
                    now={now}
                    showSchool={showSchool}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <BoxCard
                        device={device}
                        readings={readings}
                        running={stirState.running}
                    />
                    <CoreCard device={device} readings={readings} />
                    <StirCard device={device} stirState={stirState} />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {METRICS.map((m) => (
                        <MetricTile
                            key={m}
                            metric={m}
                            value={device.latest?.[m] ?? null}
                            readings={lastSix}
                            over={device.alerts.includes(m)}
                            active={metric === m}
                            onSelect={() => setMetric(m)}
                        />
                    ))}
                </div>

                <ChartCard
                    metric={metric}
                    onMetric={setMetric}
                    readings={readings}
                    now={now}
                />
            </div>
        </>
    );
}

function DeviceHeader({
    device,
    now,
    showSchool,
}: {
    device: Device;
    now: number;
    showSchool: boolean;
}) {
    const [copied, copy] = useClipboard();

    return (
        <header className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                            {deviceName(device)}
                        </h1>
                        <StatusBadge status={device.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {showSchool && (
                            <span className="rounded-full border bg-card px-3 py-1">
                                {device.school?.name ?? 'Belum ditetapkan'}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => void copy(device.hardware_id)}
                            aria-label={`Salin ID perangkat ${device.hardware_id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            {device.hardware_id}
                            {copied === device.hardware_id ? (
                                <Check className="size-3.5 text-ok" />
                            ) : (
                                <Copy className="size-3.5" />
                            )}
                        </button>
                        <span className="px-1 text-muted-foreground">
                            Data terakhir {timeAgo(device.last_seen_at, now)}
                        </span>
                    </div>
                </div>
                <LiveIndicator now={now} />
            </div>
            {device.status === 'peringatan' && (
                <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                    <p>
                        <span className="font-medium text-warn">
                            {alertText(device.alerts)}.
                        </span>{' '}
                        Aduk kompos untuk meratakan panas dan gas, lalu pantau
                        lagi dalam 15 menit.
                    </p>
                </div>
            )}
        </header>
    );
}

function BoxCard({
    device,
    readings,
    running,
}: {
    device: Device;
    readings: Reading[];
    running: boolean;
}) {
    return (
        <section className="relative flex flex-col items-center overflow-hidden rounded-2xl border bg-gradient-to-b from-brand-soft via-card to-card p-6 shadow-soft">
            <BoxGauge
                tempCore={device.latest?.temp_core ?? null}
                gas={device.latest?.gas ?? null}
                status={device.status}
                maxTemp={MAX}
                stirring={running}
                className="max-w-[12rem]"
            />
            <p className="mt-4 text-center text-sm text-balance text-muted-foreground">
                {readings.length
                    ? 'Warna kompos mengikuti suhu inti. Gelembung makin rapat saat gas naik.'
                    : 'Belum ada data dari perangkat ini.'}
            </p>
        </section>
    );
}

function CoreCard({
    device,
    readings,
}: {
    device: Device;
    readings: Reading[];
}) {
    const temp = device.latest?.temp_core ?? null;
    const values = series(readings, 'temp_core');
    const avg = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;

    return (
        <section className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Suhu inti</h2>
            <p className="text-sm text-muted-foreground">
                Garis kecil di lingkaran menandai batas {MAX} °C.
            </p>
            <RadialGauge
                value={temp}
                min={15}
                max={75}
                threshold={MAX}
                color={
                    device.status === 'offline'
                        ? 'var(--offline)'
                        : heatColor(temp, MAX)
                }
                className="mx-auto mt-2 w-full max-w-[13rem]"
            >
                <div
                    className={cn(
                        'flex items-baseline gap-0.5',
                        device.alerts.includes('temp_core') && 'text-warn',
                    )}
                >
                    <AnimatedNumber
                        value={temp}
                        metric="temp_core"
                        className="text-4xl font-semibold tracking-tight"
                    />
                    <span className="text-muted-foreground">°C</span>
                </div>
                <span className="mt-1 max-w-[9rem] text-xs text-muted-foreground">
                    {phase(temp, MAX)}
                </span>
            </RadialGauge>
            <dl className="mt-auto grid grid-cols-3 gap-2 border-t pt-4 text-center">
                {(
                    [
                        [
                            'Terendah',
                            values.length ? Math.min(...values) : null,
                        ],
                        ['Rata-rata', avg],
                        [
                            'Tertinggi',
                            values.length ? Math.max(...values) : null,
                        ],
                    ] as const
                ).map(([label, v]) => (
                    <div key={label}>
                        <dt className="text-xs text-muted-foreground">
                            {label} 24 jam
                        </dt>
                        <dd className="tabular mt-0.5 font-semibold">
                            {formatValue(v, 'temp_core')} °C
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

const PRESETS = [15, 30, 60, 90, 120];

function StirCard({
    device,
    stirState,
}: {
    device: Device;
    stirState: ReturnType<typeof useStir>;
}) {
    const [duration, setDuration] = useState(30);
    const { stir, running, remaining, cooldown, runUntil, disabled } =
        stirState;

    return (
        <section className="flex flex-col rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Aduk kompos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Pengaduk berputar selama waktu yang dipilih lalu berhenti
                sendiri.
            </p>

            <div className="mt-5 flex items-baseline justify-between">
                <label htmlFor="stir-duration" className="text-sm font-medium">
                    Lama pengadukan
                </label>
                <span className="tabular text-2xl font-semibold tracking-tight">
                    {duration}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                        detik
                    </span>
                </span>
            </div>
            <div
                role="group"
                aria-label="Pilihan cepat"
                className="mt-3 grid grid-cols-5 gap-1 rounded-lg bg-muted p-1"
            >
                {PRESETS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        disabled={running}
                        aria-pressed={duration === p}
                        onClick={() => setDuration(p)}
                        className={cn(
                            'tabular rounded-md py-1.5 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50',
                            duration === p
                                ? 'bg-card text-foreground shadow-soft'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {p} dtk
                    </button>
                ))}
            </div>
            <input
                id="stir-duration"
                type="range"
                min={5}
                max={120}
                step={5}
                value={duration}
                disabled={running}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-4 w-full accent-[var(--brand)] disabled:opacity-50"
            />

            <Button
                size="lg"
                className="mt-5 h-12 w-full text-base"
                disabled={disabled}
                onClick={() => stir(duration)}
            >
                <RotateCw className={cn('size-5', running && 'animate-spin')} />
                {running ? 'Sedang mengaduk' : 'Aduk sekarang'}
            </Button>

            <div
                className="mt-3 min-h-11 text-sm text-muted-foreground"
                aria-live="polite"
            >
                {device.status === 'offline' ? (
                    'Perangkat offline, jadi perintah aduk tidak akan sampai.'
                ) : running ? (
                    <>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                key={runUntil}
                                className="h-full origin-left rounded-full bg-brand"
                                style={{
                                    animation: `stir-progress ${duration}s linear reverse both`,
                                }}
                            />
                        </div>
                        <p className="tabular mt-2">
                            Pengaduk berjalan, sisa ±{remaining} detik.
                        </p>
                    </>
                ) : cooldown > 0 ? (
                    <span className="tabular">
                        Bisa diaduk lagi dalam {cooldown} detik.
                    </span>
                ) : (
                    'Satu perintah per menit untuk tiap komposter.'
                )}
            </div>
        </section>
    );
}

function ChartCard({
    metric,
    onMetric,
    readings,
    now,
}: {
    metric: Metric;
    onMetric: (m: Metric) => void;
    readings: Reading[];
    now: number;
}) {
    const data = useMemo<ChartPoint[]>(
        () =>
            readings.map((r) => ({
                t: Date.parse(r.created_at),
                temp_core: r.temp_core,
                temp_air: r.temp_air,
                humidity: r.humidity,
                gas: r.gas,
            })),
        [readings],
    );
    const values = series(readings, metric);
    const meta = metricMeta[metric];

    return (
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-semibold">
                        {meta.label}, 24 jam terakhir
                    </h2>
                    <p className="tabular mt-1 text-sm text-muted-foreground">
                        {values.length
                            ? `Antara ${formatValue(Math.min(...values), metric)} dan ${formatValue(Math.max(...values), metric)} ${meta.unit}. ${meta.hint}.`
                            : meta.hint}
                    </p>
                </div>
                <div
                    role="tablist"
                    aria-label="Pilih grafik"
                    className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1"
                >
                    {METRICS.map((m) => (
                        <button
                            key={m}
                            type="button"
                            role="tab"
                            aria-selected={metric === m}
                            onClick={() => onMetric(m)}
                            className={cn(
                                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                metric === m
                                    ? 'bg-card text-foreground shadow-soft'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {metricMeta[m].label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-4 -ml-2">
                {values.length === 0 ? (
                    <p className="py-24 text-center text-sm text-muted-foreground">
                        Sensor ini tidak mengirim data dalam 24 jam terakhir.
                    </p>
                ) : (
                    <MetricChart
                        metric={metric}
                        data={data}
                        now={now}
                        threshold={THRESHOLD[metric]}
                    />
                )}
            </div>
        </section>
    );
}
