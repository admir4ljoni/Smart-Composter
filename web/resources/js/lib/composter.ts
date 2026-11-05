import { Droplets, Thermometer, ThermometerSun, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Device, Metric, Reading, Status } from '@/types';

export const METRICS: Metric[] = ['temp_core', 'temp_air', 'humidity', 'gas'];

export const metricMeta: Record<
    Metric,
    {
        label: string;
        unit: string;
        digits: number;
        hint: string;
        icon: LucideIcon;
    }
> = {
    temp_core: {
        label: 'Suhu inti',
        unit: '°C',
        digits: 1,
        hint: 'Suhu di tengah tumpukan kompos',
        icon: Thermometer,
    },
    temp_air: {
        label: 'Suhu udara',
        unit: '°C',
        digits: 1,
        hint: 'Suhu udara di dalam kotak',
        icon: ThermometerSun,
    },
    humidity: {
        label: 'Kelembapan',
        unit: '%',
        digits: 0,
        hint: 'Kelembapan udara di dalam kotak',
        icon: Droplets,
    },
    gas: {
        label: 'Gas',
        unit: 'ppm',
        digits: 0,
        hint: 'Kadar gas dari sensor MQ-135',
        icon: Wind,
    },
};

export const statusMeta: Record<Status, { label: string; className: string }> =
    {
        normal: { label: 'Normal', className: 'text-ok' },
        peringatan: { label: 'Peringatan', className: 'text-warn' },
        offline: { label: 'Offline', className: 'text-offline' },
    };

const STATUS_RANK: Record<Status, number> = {
    peringatan: 0,
    offline: 1,
    normal: 2,
};

/** Devices that need attention first, then by name. */
export function byAttention(a: Device, b: Device): number {
    return (
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        deviceName(a).localeCompare(deviceName(b), 'id')
    );
}

export function deviceName(device: Pick<Device, 'name'>): string {
    return device.name ?? 'Tanpa nama';
}

export function formatValue(value: number | null, metric: Metric): string {
    if (value === null) {
        return '—';
    }

    const { digits } = metricMeta[metric];

    return value.toLocaleString('id-ID', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

export function alertText(alerts: Metric[]): string {
    return alerts.map((m) => `${metricMeta[m].label} tinggi`).join(', ');
}

/** Heat-scale step for a core temperature: cool → mesophilic → thermophilic → too hot. */
export function heatColor(temp: number | null, max: number): string {
    if (temp === null) {
        return 'var(--steel-deep)';
    }

    if (temp > max) {
        return 'var(--heat-hot)';
    }

    if (temp >= 40) {
        return 'var(--heat-thermo)';
    }

    return temp >= 25 ? 'var(--heat-meso)' : 'var(--heat-cool)';
}

/** 0..1 position of a core temperature on the 15–75 °C gauge. */
export function heatLevel(temp: number | null): number {
    if (temp === null) {
        return 0;
    }

    return Math.min(1, Math.max(0, (temp - 15) / 60));
}

const relative = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

export function timeAgo(iso: string | null, now: number): string {
    if (iso === null) {
        return 'belum ada';
    }

    const seconds = Math.round((now - Date.parse(iso)) / 1000);

    if (seconds < 45) {
        return 'baru saja';
    }

    if (seconds < 3600) {
        return relative.format(-Math.round(seconds / 60), 'minute');
    }

    if (seconds < 86400) {
        return relative.format(-Math.round(seconds / 3600), 'hour');
    }

    return relative.format(-Math.round(seconds / 86400), 'day');
}

// ponytail: one zone so SSR (UTC container) and the browser print the same
// time; make it per-school if schools outside WIB join.
export const TIME_ZONE = 'Asia/Jakarta';

export function clockTime(ms: number): string {
    return new Date(ms).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: TIME_ZONE,
    });
}

export function greeting(now: number): string {
    const hour = Number(
        new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric',
            hourCycle: 'h23',
            timeZone: TIME_ZONE,
        }).format(now),
    );

    if (hour < 11) {
        return 'Selamat pagi';
    }

    if (hour < 15) {
        return 'Selamat siang';
    }

    return hour < 18 ? 'Selamat sore' : 'Selamat malam';
}

/** Plain-language composting phase for a core temperature. */
export function phase(temp: number | null, max: number): string {
    if (temp === null) {
        return 'Sensor suhu inti tidak terbaca';
    }

    if (temp > max) {
        return 'Terlalu panas, aduk agar panas menyebar';
    }

    if (temp >= 40) {
        return 'Fase termofilik, penguraian aktif';
    }

    return temp >= 25
        ? 'Fase mesofilik, penguraian pelan'
        : 'Dingin, penguraian hampir berhenti';
}

/** Change of a metric over roughly the last hour of readings. */
export function trend(readings: Reading[], metric: Metric): number | null {
    const last = readings.at(-1)?.[metric];
    const before = readings.at(-13)?.[metric];

    return last == null || before == null ? null : last - before;
}

export function series(readings: Reading[], metric: Metric): number[] {
    return readings
        .map((r) => r[metric])
        .filter((v): v is number => v !== null);
}

/** Avatar text for a school: its type (SD/SMP/SMA/SMK) or its initials. */
export function schoolBadge(name: string): string {
    const [first] = name.split(' ');

    return /^[A-Z]{2,4}$/.test(first)
        ? first
        : name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('');
}
