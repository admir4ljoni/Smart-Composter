import { Head, Link } from '@inertiajs/react';
import { Check, Copy, Pencil, Radar, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/composter/status-badge';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useClipboard } from '@/hooks/use-clipboard';
import { deviceName, formatValue, timeAgo } from '@/lib/composter';
import { cn } from '@/lib/utils';
import { allDevices, schools } from '@/mock/composter';
import { index } from '@/routes/admin/devices';
import { show } from '@/routes/devices';
import type { Device } from '@/types';

const NONE = 'none';

type Save = (id: number, name: string | null, schoolId: string) => void;

export default function AdminDevices() {
    // ponytail: mock; slice 7.2 takes { devices, schools } props and patches update.
    const [devices, setDevices] = useState<Device[]>(() => allDevices());
    const [flashId, setFlashId] = useState<number | null>(null);
    const [editing, setEditing] = useState<Device | null>(null);
    const [query, setQuery] = useState('');
    const now = Date.now();

    const save: Save = (id, name, schoolId) => {
        const school = schools.find((s) => String(s.id) === schoolId);
        setDevices((list) =>
            list.map((d) =>
                d.id === id
                    ? {
                          ...d,
                          name,
                          school: school
                              ? { id: school.id, name: school.name }
                              : null,
                      }
                    : d,
            ),
        );
        setFlashId(id);
        setEditing(null);
        toast.success('Perangkat disimpan', {
            description: school
                ? `Sekarang terlihat oleh ${school.name}.`
                : 'Perangkat belum ditetapkan ke sekolah.',
        });
    };

    const unassigned = devices.filter((d) => d.school === null);
    const q = query.trim().toLowerCase();
    const assigned = devices
        .filter((d) => d.school !== null)
        .filter(
            (d) =>
                !q ||
                [d.hardware_id, d.name ?? '', d.school?.name ?? '']
                    .join(' ')
                    .toLowerCase()
                    .includes(q),
        )
        .sort((a, b) => a.school!.name.localeCompare(b.school!.name, 'id'));

    return (
        <>
            <Head title="Perangkat" />
            <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 md:px-8 md:py-8">
                <PageHeader
                    title="Perangkat"
                    description="Setiap ESP32 yang pernah mengirim data muncul di sini otomatis. Beri nama dan tetapkan ke sekolah agar sekolah itu bisa memantaunya."
                />

                <section>
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                        Perangkat baru
                        <span className="tabular rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            {unassigned.length}
                        </span>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sudah mengirim data, tapi sekolah belum bisa melihatnya.
                    </p>
                    {unassigned.length === 0 ? (
                        <p className="mt-4 rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                            Semua perangkat sudah punya sekolah. Perangkat baru
                            akan muncul di sini begitu mengirim data pertama.
                        </p>
                    ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {unassigned.map((d) => (
                                <NewDeviceCard
                                    key={d.id}
                                    device={d}
                                    now={now}
                                    onSave={save}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                Sudah ditetapkan
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {assigned.length} perangkat terpasang di
                                sekolah.
                            </p>
                        </div>
                        <label className="relative w-full sm:w-72">
                            <span className="sr-only">Cari perangkat</span>
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari nama, ID, atau sekolah"
                                className="bg-card pl-9"
                            />
                        </label>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft">
                        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_8rem_4rem] gap-4 border-b bg-muted/50 px-6 py-3 text-xs text-muted-foreground md:grid">
                            <span>Perangkat</span>
                            <span>Sekolah</span>
                            <span>Status</span>
                            <span>Data terakhir</span>
                            <span className="sr-only">Aksi</span>
                        </div>
                        {assigned.length === 0 ? (
                            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                                Tidak ada perangkat yang cocok dengan “{query}”.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {assigned.map((d) => (
                                    <li
                                        key={`${d.id}-${flashId === d.id ? 'f' : ''}`}
                                        className={cn(
                                            'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-6 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_8rem_4rem]',
                                            flashId === d.id && 'value-flash',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <Link
                                                href={show(d.id)}
                                                className="block truncate font-medium hover:text-primary"
                                            >
                                                {deviceName(d)}
                                            </Link>
                                            <HardwareId id={d.hardware_id} />
                                        </div>
                                        <span className="col-start-1 truncate text-sm md:col-start-auto">
                                            {d.school?.name}
                                        </span>
                                        <StatusBadge
                                            status={d.status}
                                            className="col-start-1 justify-self-start md:col-start-auto"
                                        />
                                        <span className="col-start-1 text-sm text-muted-foreground md:col-start-auto">
                                            {timeAgo(d.last_seen_at, now)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="col-start-2 row-start-1 justify-self-end md:col-start-auto md:row-start-auto"
                                            aria-label={`Ubah ${deviceName(d)}`}
                                            onClick={() => setEditing(d)}
                                        >
                                            <Pencil />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
            >
                <DialogContent>
                    {editing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Ubah perangkat</DialogTitle>
                                <DialogDescription>
                                    {editing.hardware_id}
                                </DialogDescription>
                            </DialogHeader>
                            <AssignForm
                                device={editing}
                                onSave={save}
                                submitLabel="Simpan perubahan"
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminDevices.layout = {
    breadcrumbs: [{ title: 'Perangkat', href: index() }],
};

function HardwareId({ id }: { id: string }) {
    const [copied, copy] = useClipboard();

    return (
        <button
            type="button"
            onClick={() => void copy(id)}
            aria-label={`Salin ID perangkat ${id}`}
            className="mt-0.5 inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            {id}
            {copied === id ? (
                <Check className="size-3 text-ok" />
            ) : (
                <Copy className="size-3" />
            )}
        </button>
    );
}

function NewDeviceCard({
    device,
    now,
    onSave,
}: {
    device: Device;
    now: number;
    onSave: Save;
}) {
    const r = device.latest;

    return (
        <article className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    {device.status !== 'offline' && (
                        <span className="absolute inset-0 animate-ping rounded-xl bg-brand/20 motion-reduce:hidden" />
                    )}
                    <Radar className="relative size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <HardwareId id={device.hardware_id} />
                    <p className="text-sm text-muted-foreground">
                        Data terakhir {timeAgo(device.last_seen_at, now)}
                    </p>
                </div>
                <StatusBadge status={device.status} />
            </div>
            {r && (
                <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-sm">
                    <div>
                        <dt className="text-xs text-muted-foreground">
                            Suhu inti
                        </dt>
                        <dd className="tabular font-medium">
                            {formatValue(r.temp_core, 'temp_core')} °C
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Gas</dt>
                        <dd className="tabular font-medium">
                            {formatValue(r.gas, 'gas')} ppm
                        </dd>
                    </div>
                </dl>
            )}
            <AssignForm
                device={device}
                onSave={onSave}
                submitLabel="Tetapkan"
                requireSchool
            />
        </article>
    );
}

function AssignForm({
    device,
    onSave,
    submitLabel,
    requireSchool = false,
}: {
    device: Device;
    onSave: Save;
    submitLabel: string;
    requireSchool?: boolean;
}) {
    const [name, setName] = useState(device.name ?? '');
    const [schoolId, setSchoolId] = useState(
        device.school ? String(device.school.id) : NONE,
    );

    return (
        <form
            className="grid gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                onSave(device.id, name.trim() || null, schoolId);
            }}
        >
            <div className="grid gap-1.5">
                <Label htmlFor={`name-${device.id}`}>Nama komposter</Label>
                <Input
                    id={`name-${device.id}`}
                    value={name}
                    placeholder="mis. Komposter Kantin"
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`school-${device.id}`}>Sekolah</Label>
                <Select value={schoolId} onValueChange={setSchoolId}>
                    <SelectTrigger
                        id={`school-${device.id}`}
                        className="w-full"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE}>Belum ditetapkan</SelectItem>
                        {schools.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                type="submit"
                className="mt-1"
                disabled={requireSchool && schoolId === NONE}
            >
                {submitLabel}
            </Button>
        </form>
    );
}
