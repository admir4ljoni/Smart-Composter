import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { DemoBox } from '@/components/composter/demo-box';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-dvh bg-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="flex flex-col px-6 py-8 sm:px-12">
                <Link
                    href={home()}
                    className="flex items-center gap-2.5 self-start rounded-md font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
                        <AppLogoIcon className="size-5 fill-current" />
                    </span>
                    {name}
                </Link>
                <div className="flex flex-1 items-center justify-center py-12">
                    <div className="flex w-full max-w-sm animate-in flex-col gap-8 duration-500 fade-in slide-in-from-bottom-2">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="mt-2 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            <div className="relative hidden p-3 lg:block">
                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border bg-gradient-to-br from-brand-soft via-card to-background">
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-soft)_0%,transparent_60%)]"
                    />
                    <DemoBox className="relative w-full max-w-[15rem]" />
                    <p className="relative mt-14 max-w-xs text-center text-balance text-muted-foreground">
                        Suhu, kelembapan, dan gas dari komposter sekolah Anda,
                        diperbarui setiap menit.
                    </p>
                </div>
            </div>
        </div>
    );
}
