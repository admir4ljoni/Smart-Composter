import { Link } from '@inertiajs/react';
import { Building2, Cpu, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { setMockRole, useMockDevices, useMockViewer } from '@/mock/composter';
import { dashboard } from '@/routes';
import { index as adminDevices } from '@/routes/admin/devices';
import { index as adminSchools } from '@/routes/admin/schools';
import { index as adminUsers } from '@/routes/admin/users';
import type { NavItem, Status } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dasbor', href: dashboard(), icon: LayoutGrid },
];

const adminNavItems: NavItem[] = [
    { title: 'Perangkat', href: adminDevices(), icon: Cpu },
    { title: 'Sekolah', href: adminSchools(), icon: Building2 },
    { title: 'Pengguna', href: adminUsers(), icon: Users },
];

export function AppSidebar() {
    // ponytail: mock viewer; slice 5.2 gates this on auth.user.is_superadmin.
    const { role } = useMockViewer();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-2 pt-2">
                <NavMain label="Pemantauan" items={mainNavItems} />
                {role === 'superadmin' && (
                    <NavMain label="Kelola" items={adminNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter className="gap-3">
                <FleetHealth />
                {import.meta.env.DEV && <ViewerSwitch />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

const SEGMENT: Record<Status, string> = {
    normal: 'bg-brand',
    peringatan: 'bg-heat-thermo',
    offline: 'bg-offline/50',
};

/** How many of the viewer's composters are reporting, at a glance. */
function FleetHealth() {
    const devices = useMockDevices().devices.filter((d) => d.school);
    const online = devices.filter((d) => d.status !== 'offline').length;

    return (
        <div className="rounded-xl border border-sidebar-border bg-background/60 p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-baseline justify-between text-xs">
                <span className="text-sidebar-foreground">
                    Komposter online
                </span>
                <span className="tabular font-semibold text-foreground">
                    {online}/{devices.length}
                </span>
            </div>
            <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                {[...devices]
                    .sort((a, b) => a.status.localeCompare(b.status))
                    .map((d) => (
                        <span
                            key={d.id}
                            className={cn(
                                'flex-1 transition-colors duration-700',
                                SEGMENT[d.status],
                            )}
                        />
                    ))}
            </div>
        </div>
    );
}

/** Dev-only: preview the app as a school user or as the superadmin. */
function ViewerSwitch() {
    const { role } = useMockViewer();

    return (
        <div className="group-data-[collapsible=icon]:hidden">
            <div className="px-1 pb-1.5 text-xs text-sidebar-foreground/80">
                Pratinjau sebagai
            </div>
            <div
                role="radiogroup"
                aria-label="Pratinjau sebagai"
                className="relative grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-medium"
            >
                <span
                    aria-hidden
                    className={cn(
                        'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-card shadow-soft transition-transform duration-300 ease-out',
                        role === 'superadmin' && 'translate-x-full',
                    )}
                />
                {(
                    [
                        ['school', 'Sekolah'],
                        ['superadmin', 'Superadmin'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={role === value}
                        onClick={() => setMockRole(value)}
                        className={cn(
                            'relative rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                            role === value
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
