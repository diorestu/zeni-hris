import { Link } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarDays,
    CalendarRange,
    GitBranch,
    HandCoins,
    LayoutGrid,
    Timer,
    UsersRound,
    WalletCards,
} from 'lucide-react';
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
import { dashboard } from '@/routes';
import { index as attendancesIndex } from '@/routes/hris/attendances';
import { index as employeesIndex } from '@/routes/hris/employees';
import { index as leavesIndex } from '@/routes/hris/leaves';
import { index as overtimesIndex } from '@/routes/hris/overtimes';
import { index as kasbonsIndex } from '@/routes/hris/kasbons';
import { index as payrollsIndex } from '@/routes/hris/payrolls';
import { index as schedulesIndex } from '@/routes/hris/schedules';
import type { NavGroup } from '@/types';

const mainNavGroups: NavGroup[] = [
    {
        title: 'Umum',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'SDM',
        items: [
            {
                title: 'Karyawan',
                href: employeesIndex(),
                icon: UsersRound,
            },
            {
                title: 'Org Chart',
                href: '/hris/organization-chart',
                icon: GitBranch,
            },
        ],
    },
    {
        title: 'Waktu Kerja',
        items: [
            {
                title: 'Kehadiran',
                href: attendancesIndex(),
                icon: CalendarDays,
            },
            {
                title: 'Jadwal Kerja',
                href: schedulesIndex(),
                icon: CalendarRange,
            },
            {
                title: 'Cuti',
                href: leavesIndex(),
                icon: CalendarClock,
            },
            {
                title: 'Lembur',
                href: overtimesIndex(),
                icon: Timer,
            },
        ],
    },
    {
        title: 'Payroll',
        items: [
            {
                title: 'Penggajian',
                href: payrollsIndex(),
                icon: WalletCards,
            },
            {
                title: 'Kasbon',
                href: kasbonsIndex(),
                icon: HandCoins,
            },
        ],
    },
];

export function AppSidebar() {
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

            <SidebarContent>
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
