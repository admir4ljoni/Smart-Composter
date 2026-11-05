import { Head } from '@inertiajs/react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { schools, users as initial } from '@/mock/composter';
import { index } from '@/routes/admin/users';
import type { ManagedUser } from '@/types';

type Filter = 'all' | 'superadmin' | number;

export default function AdminUsers() {
    // ponytail: mock; slice 6.2 takes { users, schools } props and posts to store.
    const [users, setUsers] = useState<ManagedUser[]>(initial);
    const [flashId, setFlashId] = useState<number | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const initials = useInitials();

    const add = (user: Omit<ManagedUser, 'id'>) => {
        const id = Math.max(...users.map((u) => u.id)) + 1;
        setUsers([...users, { ...user, id }]);
        setFlashId(id);
        setFilter('all');
        toast.success('Pengguna ditambahkan', {
            description: `${user.name} sudah bisa masuk dengan email ${user.email}.`,
        });
    };

    const q = query.trim().toLowerCase();
    const shown = users.filter(
        (u) =>
            (filter === 'all' ||
                (filter === 'superadmin'
                    ? u.is_superadmin
                    : u.school?.id === filter)) &&
            (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)),
    );
    const chips: [Filter, string, number][] = [
        ['all', 'Semua', users.length],
        ...schools
            .map(
                (s) =>
                    [
                        s.id,
                        s.name,
                        users.filter((u) => u.school?.id === s.id).length,
                    ] as [Filter, string, number],
            )
            .filter(([, , n]) => n > 0),
        [
            'superadmin',
            'Superadmin',
            users.filter((u) => u.is_superadmin).length,
        ],
    ];

    return (
        <>
            <Head title="Pengguna" />
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                <PageHeader
                    title="Pengguna"
                    description="Akun guru dan staf sekolah. Pendaftaran mandiri ditutup, jadi semua akun dibuat di sini."
                    action={<AddUser onAdd={add} />}
                />

                <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div
                        role="group"
                        aria-label="Saring menurut sekolah"
                        className="flex flex-wrap gap-2"
                    >
                        {chips.map(([value, label, count]) => (
                            <button
                                key={String(value)}
                                type="button"
                                aria-pressed={filter === value}
                                onClick={() => setFilter(value)}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    filter === value
                                        ? 'border-brand bg-brand-soft text-accent-foreground'
                                        : 'bg-card text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                                <span className="tabular text-xs opacity-70">
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <label className="relative w-full lg:w-72">
                        <span className="sr-only">Cari pengguna</span>
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari nama atau email"
                            className="bg-card pl-9"
                        />
                    </label>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft">
                    <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem] gap-4 border-b bg-muted/50 px-6 py-3 text-xs text-muted-foreground sm:grid">
                        <span>Nama</span>
                        <span>Sekolah</span>
                        <span>Peran</span>
                    </div>
                    {shown.length === 0 ? (
                        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Tidak ada pengguna yang cocok. Ubah saringan atau
                            kata pencarian.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {shown.map((u) => (
                                <li
                                    key={`${u.id}-${flashId === u.id ? 'f' : ''}`}
                                    className={cn(
                                        'grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-6 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem]',
                                        flashId === u.id && 'value-flash',
                                    )}
                                >
                                    <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                                                u.is_superadmin
                                                    ? 'bg-foreground text-background'
                                                    : 'bg-brand-soft text-accent-foreground',
                                            )}
                                        >
                                            {initials(u.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">
                                                {u.name}
                                            </div>
                                            <div className="truncate text-sm text-muted-foreground">
                                                {u.email}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="col-start-2 truncate text-sm sm:col-start-auto">
                                        {u.school?.name ?? 'Semua sekolah'}
                                    </span>
                                    <span className="col-start-2 sm:col-start-auto">
                                        {u.is_superadmin ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                                                <ShieldCheck className="size-3.5" />
                                                Superadmin
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                Pengguna sekolah
                                            </span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

AdminUsers.layout = {
    breadcrumbs: [{ title: 'Pengguna', href: index() }],
};

type Errors = Partial<Record<'name' | 'email' | 'password' | 'school', string>>;

function AddUser({ onAdd }: { onAdd: (u: Omit<ManagedUser, 'id'>) => void }) {
    const [open, setOpen] = useState(false);
    const [schoolId, setSchoolId] = useState('');
    const [errors, setErrors] = useState<Errors>({});

    const submit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const name = (form.get('name') as string).trim();
        const email = (form.get('email') as string).trim();
        const password = form.get('password') as string;
        const school = schools.find((s) => String(s.id) === schoolId);
        const next: Errors = {};

        if (!name) {
            next.name = 'Isi nama pengguna.';
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            next.email = 'Isi alamat email yang valid.';
        }

        if (password.length < 8) {
            next.password = 'Kata sandi minimal 8 karakter.';
        }

        if (!school) {
            next.school = 'Pilih sekolah pengguna ini.';
        }

        setErrors(next);

        if (Object.keys(next).length || !school) {
            return;
        }

        onAdd({
            name,
            email,
            is_superadmin: false,
            school: { id: school.id, name: school.name },
        });
        setSchoolId('');
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                setErrors({});
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    Tambah pengguna
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <DialogTitle>Tambah pengguna</DialogTitle>
                        <DialogDescription>
                            Bagikan email dan kata sandi ini ke guru. Mereka
                            bisa menggantinya di Pengaturan setelah masuk.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="user-name">Nama</Label>
                        <Input id="user-name" name="name" autoFocus />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user-email">Alamat email</Label>
                        <Input
                            id="user-email"
                            name="email"
                            type="email"
                            placeholder="guru@sekolah.sch.id"
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user-password">Kata sandi awal</Label>
                        <PasswordInput
                            id="user-password"
                            name="password"
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user-school">Sekolah</Label>
                        <Select value={schoolId} onValueChange={setSchoolId}>
                            <SelectTrigger id="user-school">
                                <SelectValue placeholder="Pilih sekolah" />
                            </SelectTrigger>
                            <SelectContent>
                                {schools.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.school} />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Tambah pengguna</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
