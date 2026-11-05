import { Head, Link } from '@inertiajs/react';
import { BoxGauge } from '@/components/composter/box-gauge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

const MESSAGES: Record<number, { title: string; body: string }> = {
    403: {
        title: 'Halaman ini bukan untuk akun Anda',
        body: 'Komposter atau halaman ini milik sekolah lain, atau hanya bisa dibuka superadmin. Kembali ke dasbor untuk melihat komposter sekolah Anda.',
    },
    404: {
        title: 'Halaman tidak ditemukan',
        body: 'Alamatnya mungkin salah ketik, atau perangkatnya sudah dihapus. Buka dasbor untuk melihat daftar komposter.',
    },
    500: {
        title: 'Server sedang bermasalah',
        body: 'Permintaan Anda tidak selesai diproses. Muat ulang halaman sebentar lagi. Jika masih gagal, hubungi admin program.',
    },
    503: {
        title: 'Sedang dalam perawatan',
        body: 'Dasbor sedang diperbarui dan akan kembali sebentar lagi. Komposter tetap bekerja dan datanya tetap tersimpan.',
    },
};

// Backend wires this via bootstrap/app.php ->respond() in a later slice.
export default function ErrorPage({ status }: { status: number }) {
    const msg = MESSAGES[status] ?? MESSAGES[500];

    return (
        <>
            <Head title={msg.title} />
            <div className="mx-auto grid min-h-[70vh] max-w-4xl items-center gap-12 px-4 py-16 md:grid-cols-[minmax(0,1fr)_14rem]">
                <div>
                    <span className="tabular inline-flex rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                        Kode {status}
                    </span>
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance">
                        {msg.title}
                    </h1>
                    <p className="mt-4 max-w-prose leading-relaxed text-muted-foreground">
                        {msg.body}
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href={dashboard()}>Kembali ke dasbor</Link>
                    </Button>
                </div>
                <BoxGauge
                    tempCore={null}
                    gas={null}
                    status="offline"
                    maxTemp={60}
                    className="mx-auto hidden max-w-[12rem] md:block"
                />
            </div>
        </>
    );
}
