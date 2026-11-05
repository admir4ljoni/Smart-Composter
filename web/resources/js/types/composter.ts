// Shapes the controllers will pass as Inertia props (PLAN.md §4, §6, §7).

export type Status = 'normal' | 'peringatan' | 'offline';

export type Metric = 'temp_core' | 'temp_air' | 'humidity' | 'gas';

export type Reading = {
    temp_core: number | null;
    temp_air: number | null;
    humidity: number | null;
    gas: number | null;
    created_at: string;
};

export type SchoolRef = { id: number; name: string };

export type School = SchoolRef & {
    devices_count: number;
    users_count: number;
};

export type Device = {
    id: number;
    hardware_id: string;
    name: string | null;
    school: SchoolRef | null;
    last_seen_at: string | null;
    status: Status;
    /** Metrics over threshold, so the badge can say why. */
    alerts: Metric[];
    latest: Reading | null;
};

export type ManagedUser = {
    id: number;
    name: string;
    email: string;
    is_superadmin: boolean;
    school: SchoolRef | null;
};

export type Thresholds = {
    temp_core_max: number;
    gas_max: number;
    offline_after_minutes: number;
};
