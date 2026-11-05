import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-w-0 overflow-x-clip md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:shadow-none"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {/* One short page transition per navigation, keyed on the path. */}
                <div
                    key={url.split('?')[0]}
                    className="flex flex-1 animate-in flex-col duration-300 fade-in slide-in-from-bottom-1"
                >
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
