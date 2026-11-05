// ponytail: UI-only mock. Each page swaps these hooks for controller props +
// usePoll(10s) in TASKS.md slices 3–8; delete this folder after slice 8.
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type {
    Device,
    ManagedUser,
    Metric,
    Reading,
    School,
    SchoolRef,
    Thresholds,
} from '@/types';

export const thresholds: Thresholds = {
    temp_core_max: 60,
    gas_max: 800,
    offline_after_minutes: 5,
};

export const schools: School[] = [
    { id: 1, name: 'SMP Negeri 4 Sukamaju', devices_count: 2, users_count: 2 },
    { id: 2, name: 'SD Negeri Mekarsari 2', devices_count: 2, users_count: 1 },
    { id: 3, name: 'SMA Taruna Bakti', devices_count: 2, users_count: 1 },
    { id: 4, name: 'SMK Bina Karya', devices_count: 0, users_count: 0 },
];

const ref = (id: number): SchoolRef => {
    const { name } = schools.find((s) => s.id === id)!;

    return { id, name };
};

export const users: ManagedUser[] = [
    {
        id: 1,
        name: 'Admin PTIK',
        email: 'admin@ptik.example',
        is_superadmin: true,
        school: null,
    },
    {
        id: 2,
        name: 'Bu Ratna Wulandari',
        email: 'ratna@smpn4sukamaju.example',
        is_superadmin: false,
        school: ref(1),
    },
    {
        id: 3,
        name: 'Pak Dedi Kurniawan',
        email: 'dedi@smpn4sukamaju.example',
        is_superadmin: false,
        school: ref(1),
    },
    {
        id: 4,
        name: 'Bu Siti Aminah',
        email: 'siti@sdnmekarsari2.example',
        is_superadmin: false,
        school: ref(2),
    },
    {
        id: 5,
        name: 'Pak Yoga Pratama',
        email: 'yoga@tarunabakti.example',
        is_superadmin: false,
        school: ref(3),
    },
];

type Profile = {
    core: number;
    air: number;
    humidity: number | null;
    gas: number;
    swing: number;
    phase: number;
    /** Minutes since last telemetry; null = never connected. */
    silentFor?: number | null;
};

const fixtures: {
    id: number;
    hardware_id: string;
    name: string | null;
    school_id: number | null;
    p: Profile;
}[] = [
    {
        id: 1,
        hardware_id: 'esp32-A4CF12B8E901',
        name: 'Komposter Kantin',
        school_id: 1,
        p: { core: 47, air: 31, humidity: 84, gas: 380, swing: 4, phase: 0 },
    },
    {
        id: 2,
        hardware_id: 'esp32-A4CF12B8E902',
        name: 'Komposter Taman Belakang',
        school_id: 1,
        p: { core: 52, air: 32, humidity: 88, gas: 935, swing: 3, phase: 1 },
    },
    {
        id: 3,
        hardware_id: 'esp32-24DCC3A1F0B4',
        name: 'Komposter Utama',
        school_id: 2,
        p: { core: 38, air: 29, humidity: 79, gas: 290, swing: 3, phase: 2 },
    },
    {
        id: 4,
        hardware_id: 'esp32-24DCC3A1F0B5',
        name: 'Komposter Kebun Sekolah',
        school_id: 2,
        p: {
            core: 33,
            air: 28,
            humidity: 75,
            gas: 240,
            swing: 2,
            phase: 3,
            silentFor: 192,
        },
    },
    {
        id: 5,
        hardware_id: 'esp32-30AEA47C1D22',
        name: 'Komposter Kelas IX',
        school_id: 3,
        p: { core: 66, air: 33, humidity: 90, gas: 610, swing: 2, phase: 4 },
    },
    {
        id: 6,
        hardware_id: 'esp32-30AEA47C1D23',
        name: null,
        school_id: 3,
        p: { core: 29, air: 30, humidity: null, gas: 205, swing: 3, phase: 5 },
    },
    {
        id: 7,
        hardware_id: 'esp32-7C9EBD45A0C1',
        name: null,
        school_id: null,
        p: { core: 26, air: 27, humidity: 70, gas: 180, swing: 2, phase: 6 },
    },
    {
        id: 8,
        hardware_id: 'esp32-7C9EBD45A0C2',
        name: null,
        school_id: null,
        p: { core: 31, air: 29, humidity: 72, gas: 260, swing: 2, phase: 1.5 },
    },
    {
        id: 9,
        hardware_id: 'esp32-E8DB84C2B710',
        name: null,
        school_id: null,
        p: {
            core: 0,
            air: 0,
            humidity: null,
            gas: 0,
            swing: 0,
            phase: 0,
            silentFor: null,
        },
    },
];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Deterministic noise in [-1, 1] so history stays stable between renders. */
function noise(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;

    return (x - Math.floor(x)) * 2 - 1;
}

const round = (v: number, digits: number) => Number(v.toFixed(digits));

function readingAt(id: number, p: Profile, t: number): Reading {
    const day = (2 * Math.PI * t) / DAY;
    const n = (k: number) => noise(id * 977 + Math.floor(t / 10_000) * 31 + k);

    return {
        temp_core: round(
            p.core + p.swing * Math.sin(day + p.phase) + n(1) * 0.15,
            1,
        ),
        temp_air: round(p.air + 3 * Math.sin(day - 1.2) + n(2) * 0.1, 1),
        humidity:
            p.humidity === null
                ? null
                : round(
                      Math.min(
                          100,
                          p.humidity + 4 * Math.sin(day + 0.5) + n(3) * 0.3,
                      ),
                      1,
                  ),
        gas: Math.round(
            Math.max(
                0,
                p.gas * (1 + 0.1 * Math.sin(day * 2 + p.phase)) + n(4) * 6,
            ),
        ),
        created_at: new Date(t).toISOString(),
    };
}

function lastSeen(p: Profile, now: number): number | null {
    if (p.silentFor === null) {
        return null;
    }

    return p.silentFor === undefined
        ? now - 20_000
        : now - p.silentFor * MINUTE;
}

function buildDevice(f: (typeof fixtures)[number], now: number): Device {
    const seen = lastSeen(f.p, now);
    const latest = seen === null ? null : readingAt(f.id, f.p, seen);
    const alerts: Metric[] = [];

    if (
        latest?.temp_core != null &&
        latest.temp_core > thresholds.temp_core_max
    ) {
        alerts.push('temp_core');
    }

    if (latest?.gas != null && latest.gas > thresholds.gas_max) {
        alerts.push('gas');
    }

    const offline =
        seen === null || now - seen > thresholds.offline_after_minutes * MINUTE;

    return {
        id: f.id,
        hardware_id: f.hardware_id,
        name: f.name,
        school: f.school_id === null ? null : ref(f.school_id),
        last_seen_at: seen === null ? null : new Date(seen).toISOString(),
        status: offline ? 'offline' : alerts.length ? 'peringatan' : 'normal',
        alerts,
        latest,
    };
}

/** 24 h of readings, one every 5 minutes, ending at the device's last telemetry. */
export function mockHistory(id: number, now: number): Reading[] {
    const f = fixtures.find((d) => d.id === id);
    const end = f && lastSeen(f.p, now);

    if (!f || end == null) {
        return [];
    }

    const step = 5 * MINUTE;
    const out: Reading[] = [];

    for (let t = Math.floor((now - DAY) / step) * step; t <= end; t += step) {
        out.push(readingAt(id, f.p, t));
    }

    return out;
}

/** Ticks every 10 s, like the real page's usePoll. */
export function useNow(interval = 10_000): number {
    // Snapped to the interval so the SSR render and hydration agree.
    const snap = () => Math.floor(Date.now() / interval) * interval;
    const [now, setNow] = useState(snap);

    useEffect(() => {
        const id = setInterval(() => setNow(snap()), interval);

        return () => clearInterval(id);
    }, [interval]);

    return now;
}

// --- Dev-only viewer switch: preview the school-user vs superadmin views ---

export type MockRole = 'school' | 'superadmin';
const ROLE_KEY = 'mock-role';
const listeners = new Set<() => void>();

function readRole(): MockRole {
    try {
        return localStorage.getItem(ROLE_KEY) === 'superadmin'
            ? 'superadmin'
            : 'school';
    } catch {
        return 'school';
    }
}

export function setMockRole(role: MockRole): void {
    try {
        localStorage.setItem(ROLE_KEY, role);
    } catch {
        // Private mode: the switch just won't persist.
    }

    listeners.forEach((l) => l());
}

export function useMockViewer(): { role: MockRole; school: SchoolRef | null } {
    const role = useSyncExternalStore(
        (l) => {
            listeners.add(l);

            return () => listeners.delete(l);
        },
        readRole,
        () => 'school' as const,
    );

    return { role, school: role === 'school' ? ref(1) : null };
}

/** Devices the current mock viewer may see (mirrors Device::scopeVisibleTo). */
export function useMockDevices(): { devices: Device[]; now: number } {
    const now = useNow();
    const { role } = useMockViewer();
    const devices = useMemo(
        () =>
            fixtures
                .filter((f) => role === 'superadmin' || f.school_id === 1)
                .map((f) => buildDevice(f, now)),
        [now, role],
    );

    return { devices, now };
}

export function useMockDevice(id: number): {
    device: Device | null;
    readings: Reading[];
    now: number;
} {
    const { devices, now } = useMockDevices();
    const device = devices.find((d) => d.id === id) ?? null;
    const readings = useMemo(
        () => (device ? mockHistory(device.id, now) : []),
        [device, now],
    );

    return { device, readings, now };
}

export function allDevices(now = Date.now()): Device[] {
    return fixtures.map((f) => buildDevice(f, now));
}

// Mirrors the backend throttle: one stir per device per minute.
const lastStir = new Map<number, number>();

export function mockStir(
    deviceId: number,
): { ok: true } | { ok: false; retryIn: number } {
    const since = Date.now() - (lastStir.get(deviceId) ?? 0);

    if (since < MINUTE) {
        return { ok: false, retryIn: Math.ceil((MINUTE - since) / 1000) };
    }

    lastStir.set(deviceId, Date.now());

    return { ok: true };
}

/** Recent readings per device for dashboard sparklines (last `hours`). */
export function useMockRecent(
    devices: Device[],
    now: number,
    hours = 6,
): Record<number, Reading[]> {
    return useMemo(
        () =>
            Object.fromEntries(
                devices.map((d) => [
                    d.id,
                    mockHistory(d.id, now).filter(
                        (r) =>
                            Date.parse(r.created_at) >=
                            now - hours * 60 * MINUTE,
                    ),
                ]),
            ),
        [devices, now, hours],
    );
}
