import { Head, Link, usePage } from '@inertiajs/react';
import {
    BellRing,
    Cog,
    Droplets,
    RotateCw,
    Smartphone,
    Thermometer,
    Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { DemoBox } from '@/components/composter/demo-box';
import { Sparkline } from '@/components/composter/sparkline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard, login } from '@/routes';

const SENSORS = [
    {
        icon: Thermometer,
        part: 'DS18B20',
        title: 'Suhu inti',
        body: 'Probe tahan air di tengah tumpukan. Menunjukkan apakah penguraian sedang aktif atau terlalu panas.',
        wave: [31, 34, 38, 43, 47, 50, 52, 51, 49, 50, 53, 55],
    },
    {
        icon: Droplets,
        part: 'DHT22',
        title: 'Suhu udara dan kelembapan',
        body: 'Mengukur udara di dalam kotak. Kompos yang terlalu kering atau terlalu basah melambat.',
        wave: [82, 84, 85, 83, 86, 88, 87, 86, 84, 85, 86, 85],
    },
    {
        icon: Wind,
        part: 'MQ-135',
        title: 'Kadar gas',
        body: 'Gas naik saat bahan menumpuk tanpa diaduk. Dasbor memberi tanda sebelum baunya keluar.',
        wave: [300, 320, 360, 420, 520, 610, 700, 650, 480, 400, 380, 390],
    },
    {
        icon: Cog,
        part: 'BTS7960',
        title: 'Motor pengaduk',
        body: 'Menggerakkan pengaduk saat guru menekan tombol aduk, lalu berhenti sendiri setelah waktunya habis.',
        wave: [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    },
];

const STEPS = [
    {
        icon: RotateCw,
        title: 'Isi kotak dengan sampah organik',
        body: 'Sisa makanan kantin dan daun taman masuk ke kotak stainless yang tertutup rapat.',
    },
    {
        icon: BellRing,
        title: 'Sensor melapor setiap menit',
        body: 'ESP32 mengirim suhu, kelembapan, dan gas. Dasbor menandai kotak yang perlu dicek.',
    },
    {
        icon: Smartphone,
        title: 'Pantau dan aduk dari ponsel',
        body: 'Guru melihat kondisi kompos kapan saja dan menjalankan pengaduk tanpa membuka kotak.',
    },
];

export default function Welcome() {
    const { auth, name } = usePage().props;
    const [stirring, setStirring] = useState(false);
    const target = auth.user ? dashboard() : login();
    const cta = auth.user ? 'Buka dasbor' : 'Masuk ke dasbor';

    useEffect(() => {
        if (!stirring) {
            return;
        }

        const id = setTimeout(() => setStirring(false), 4000);

        return () => clearTimeout(id);
    }, [stirring]);

    return (
        <>
            <Head title="Pantau komposter sekolah" />
            <div className="min-h-svh bg-card">
                <header className="sticky top-0 z-30 border-b border-transparent bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
                        <span className="flex items-center gap-2.5 font-semibold">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
                                <AppLogoIcon className="size-5 fill-current" />
                            </span>
                            {name}
                        </span>
                        <nav className="flex items-center gap-1 text-sm">
                            <a
                                href="#sensor"
                                className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block"
                            >
                                Sensor
                            </a>
                            <a
                                href="#cara-kerja"
                                className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block"
                            >
                                Cara kerja
                            </a>
                            <Button asChild size="sm" className="ml-2">
                                <Link href={target}>
                                    {auth.user ? 'Buka dasbor' : 'Masuk'}
                                </Link>
                            </Button>
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 right-[-10%] size-[44rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--brand-soft)_0%,transparent_65%)]"
                    />
                    <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-12 pb-20 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:px-8 md:pt-20 md:pb-28">
                        <div className="animate-in duration-700 fade-in slide-in-from-bottom-3">
                            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-soft">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-2 rounded-full bg-brand" />
                                </span>
                                Komposter anaerob untuk sekolah
                            </span>
                            <h1 className="mt-6 text-5xl leading-[1.04] font-semibold tracking-tight text-balance md:text-[4.25rem]">
                                Kompos yang bisa dipantau dari kelas.
                            </h1>
                            <p className="mt-6 max-w-[33rem] text-lg leading-relaxed text-muted-foreground">
                                Kotak komposter di sekolah mengirim suhu,
                                kelembapan, dan kadar gas setiap menit. Guru
                                melihat kondisinya di ponsel dan menjalankan
                                pengaduk dari jauh.
                            </p>
                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 px-6 text-base"
                                >
                                    <Link href={target}>{cta}</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-5 text-base"
                                    onClick={() => setStirring(true)}
                                    disabled={stirring}
                                >
                                    <RotateCw
                                        className={cn(
                                            'size-5',
                                            stirring && 'animate-spin',
                                        )}
                                    />
                                    {stirring
                                        ? 'Sedang mengaduk'
                                        : 'Coba pengaduknya'}
                                </Button>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Akun dibuat oleh admin program untuk tiap
                                sekolah.
                            </p>
                        </div>

                        <div className="relative mx-auto w-full max-w-[24rem]">
                            <div className="rounded-[2rem] border bg-gradient-to-b from-brand-soft to-card p-10 shadow-lift">
                                <DemoBox
                                    stirring={stirring}
                                    className="mx-auto max-w-[14rem]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sensors */}
                <section
                    id="sensor"
                    className="scroll-mt-20 border-y bg-background"
                >
                    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
                        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                            Empat komponen yang menjaga kompos tetap sehat
                        </h2>
                        <div className="mt-12 grid gap-4 md:grid-cols-6">
                            {SENSORS.map((s, i) => (
                                <article
                                    key={s.part}
                                    className={cn(
                                        'group flex flex-col rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
                                        [
                                            'md:col-span-4',
                                            'md:col-span-2',
                                            'md:col-span-3',
                                            'md:col-span-3',
                                        ][i],
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                            <s.icon className="size-5" />
                                        </span>
                                        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                                            {s.part}
                                        </span>
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold tracking-tight">
                                        {s.title}
                                    </h3>
                                    <p className="mt-2 leading-relaxed text-muted-foreground">
                                        {s.body}
                                    </p>
                                    <Sparkline
                                        values={s.wave}
                                        className={cn(
                                            'mt-auto pt-6',
                                            i === 0 ? 'h-24' : 'h-14',
                                        )}
                                    />
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section
                    id="cara-kerja"
                    className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:px-8 md:py-24"
                >
                    <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        Cara kerjanya
                    </h2>
                    <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
                        <div
                            aria-hidden
                            className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
                        />
                        {STEPS.map((s, i) => (
                            <li key={s.title} className="relative">
                                <span className="relative flex size-12 items-center justify-center rounded-2xl border bg-card text-brand shadow-soft">
                                    <s.icon className="size-5" />
                                    <span className="tabular absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
                                        {i + 1}
                                    </span>
                                </span>
                                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                                    {s.title}
                                </h3>
                                <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">
                                    {s.body}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* CTA */}
                <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
                    <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-center text-primary-foreground md:px-16">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-24 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.18)_0%,transparent_60%)]"
                        />
                        <h2 className="relative text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                            Sekolah Anda sudah punya akun?
                        </h2>
                        <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/80">
                            Masuk untuk melihat kondisi komposter sekolah dan
                            menjalankan pengaduk.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            variant="secondary"
                            className="relative mt-8 h-12 bg-white px-6 text-base text-primary hover:bg-white/90"
                        >
                            <Link href={target}>{cta}</Link>
                        </Button>
                    </div>
                </section>

                <footer className="border-t">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:px-8">
                        <span className="flex items-center gap-2">
                            <AppLogoIcon className="size-4 fill-current text-brand" />
                            {name}
                        </span>
                        <span>Pemantauan komposter untuk sekolah mitra.</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
