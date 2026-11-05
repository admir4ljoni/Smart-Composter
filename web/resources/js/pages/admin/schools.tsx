import { Head } from '@inertiajs/react';
import { Cpu, Pencil, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { schoolBadge } from '@/lib/composter';
import { cn } from '@/lib/utils';
import { allDevices, schools as initial } from '@/mock/composter';
import { index } from '@/routes/admin/schools';
import type { School, Status } from '@/types';

const devices = allDevices();

const SEGMENT: Record<Status, string> = {
    normal: 'bg-brand',
    peringatan: 'bg-heat-thermo',
    offline: 'bg-offline/50',
};

// null = closed, 'new' = add, School = rename.
type Editing = null | 'new' | School;

export default function AdminSchools() {
    // ponytail: mock; slice 5.2 takes { schools } props and posts to store/update.
    const [schools, setSchools] = useState<School[]>(initial);
    const [flashId, setFlashId] = useState<number | null>(null);
    const [editing, setEditing] = useState<Editing>(null);

    const submit = (name: string) => {
        if (editing === 'new') {
            const id = Math.max(...schools.map((s) => s.id)) + 1;
            setSchools([
                ...schools,
                { id, name, devices_count: 0, users_count: 0 },
            ]);
            setFlashId(id);
            toast.success('Sekolah ditambahkan', { description: name });
        } else if (editing) {
            setSchools(
                schools.map((s) => (s.id === editing.id ? { ...s, name } : s)),
            );
            setFlashId(editing.id);
            toast.success('Nama sekolah disimpan');
        }

        setEditing(null);
    };

    return (
        <>
            <Head title="Sekolah" />
            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
                <PageHeader
                    title="Sekolah"
                    description="Sekolah yang ikut program komposter. Pengguna dan perangkat ditautkan ke salah satu sekolah ini."
                    action={
                        <Button onClick={() => setEditing('new')}>
                            <Plus />
                            Tambah sekolah
                        </Button>
                    }
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {schools.map((s) => {
                        const own = devices.filter(
                            (d) => d.school?.id === s.id,
                        );

                        return (
                            <article
                                key={`${s.id}-${flashId === s.id ? 'f' : ''}`}
                                className={cn(
                                    'group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift',
                                    flashId === s.id && 'value-flash',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-semibold text-accent-foreground">
                                        {schoolBadge(s.name)}
                                    </span>
                                    <h2 className="min-w-0 flex-1 pt-0.5 leading-snug font-semibold">
                                        {s.name}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Ubah nama ${s.name}`}
                                        onClick={() => setEditing(s)}
                                        className="-mt-1 -mr-2 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                                    >
                                        <Pencil />
                                    </Button>
                                </div>

                                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="size-4 text-muted-foreground" />
                                        <dt className="sr-only">Komposter</dt>
                                        <dd>
                                            <span className="tabular font-semibold">
                                                {s.devices_count}
                                            </span>{' '}
                                            komposter
                                        </dd>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="size-4 text-muted-foreground" />
                                        <dt className="sr-only">Pengguna</dt>
                                        <dd>
                                            <span className="tabular font-semibold">
                                                {s.users_count}
                                            </span>{' '}
                                            pengguna
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-auto pt-5">
                                    {own.length > 0 ? (
                                        <>
                                            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                                                {own.map((d) => (
                                                    <span
                                                        key={d.id}
                                                        className={cn(
                                                            'flex-1',
                                                            SEGMENT[d.status],
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {
                                                    own.filter(
                                                        (d) =>
                                                            d.status ===
                                                            'normal',
                                                    ).length
                                                }{' '}
                                                dari {own.length} komposter
                                                normal
                                            </p>
                                        </>
                                    ) : (
                                        <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
                                            Belum ada komposter. Tetapkan
                                            perangkat dari halaman Perangkat.
                                        </p>
                                    )}
                                </div>
                            </article>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand-soft/50 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Plus className="size-6" />
                        <span className="text-sm font-medium">
                            Tambah sekolah
                        </span>
                    </button>
                </div>
            </div>

            <SchoolDialog
                editing={editing}
                onClose={() => setEditing(null)}
                onSubmit={submit}
            />
        </>
    );
}

AdminSchools.layout = {
    breadcrumbs: [{ title: 'Sekolah', href: index() }],
};

function SchoolDialog({
    editing,
    onClose,
    onSubmit,
}: {
    editing: Editing;
    onClose: () => void;
    onSubmit: (name: string) => void;
}) {
    const [error, setError] = useState<string>();
    const isNew = editing === 'new';
    const action = isNew ? 'Tambah sekolah' : 'Simpan nama';

    const submit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = (
            new FormData(e.currentTarget).get('name') as string
        ).trim();

        if (!name) {
            setError('Isi nama sekolah.');

            return;
        }

        setError(undefined);
        onSubmit(name);
    };

    return (
        <Dialog
            open={editing !== null}
            onOpenChange={(o) => {
                if (!o) {
                    setError(undefined);
                    onClose();
                }
            }}
        >
            <DialogContent>
                <form onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>
                            {isNew ? 'Tambah sekolah' : 'Ubah nama sekolah'}
                        </DialogTitle>
                        <DialogDescription>
                            {isNew
                                ? 'Setelah dibuat, buat akun guru untuk sekolah ini di halaman Pengguna.'
                                : 'Nama baru langsung terlihat oleh pengguna sekolah ini.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="school-name">Nama sekolah</Label>
                        <Input
                            id="school-name"
                            name="name"
                            autoFocus
                            defaultValue={
                                editing && editing !== 'new' ? editing.name : ''
                            }
                            placeholder="mis. SMP Negeri 1 Sukamaju"
                        />
                        <InputError message={error} />
                    </div>
                    <DialogFooter>
                        <Button type="submit">{action}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
