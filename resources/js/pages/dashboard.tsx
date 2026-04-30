import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type AttendancePoint = {
    date: string;
    label: string;
    present: number;
    late: number;
    on_leave: number;
    absent: number;
    attendance_rate: number;
};

type DashboardStats = {
    total_employees: number;
    active_employees: number;
    total_divisions: number;
    total_positions: number;
    present_today: number;
    late_today: number;
    on_leave_today: number;
    absent_today: number;
    open_positions: number;
    monthly_payroll_burn: number | string;
    attrition_ytd: number;
    resigned_ytd: number;
    today_attendance_rate: number;
};

type DashboardFilters = {
    range: 'today' | 'this_week' | 'this_month';
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

const formatRupiahCompact = (value: number | string) => {
    const amount = Number(value ?? 0);

    if (amount >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', {
            maximumFractionDigits: 1,
        })} M`;
    }

    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', {
            maximumFractionDigits: 1,
        })} jt`;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function Dashboard({
    stats,
    attendanceChart,
    filters,
}: {
    stats: DashboardStats;
    attendanceChart: AttendancePoint[];
    filters: DashboardFilters;
}) {
    const maxEmployees = Math.max(stats.active_employees, 1);
    const rangeOptions: Array<{
        value: DashboardFilters['range'];
        label: string;
    }> = [
        { value: 'today', label: 'Hari Ini' },
        { value: 'this_week', label: 'Minggu Ini' },
        { value: 'this_month', label: 'Bulan Ini' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Employees</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.total_employees}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Active: {stats.active_employees}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Present Today</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.present_today}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Late: {stats.late_today}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>On Leave</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.on_leave_today}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Absent: {stats.absent_today}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Open Positions</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.open_positions}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Published vacancies
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>
                                Monthly Payroll Burn
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {formatRupiahCompact(
                                    stats.monthly_payroll_burn,
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Current period net salary
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-2">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Attrition YTD</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.attrition_ytd}%
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-2">
                            <p className="text-sm text-muted-foreground">
                                Resigned: {stats.resigned_ytd}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle>Chart Kehadiran</CardTitle>
                            <div className="flex gap-2">
                                {rangeOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        size="sm"
                                        variant={
                                            filters.range === option.value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            router.get(
                                                dashboard.url(),
                                                { range: option.value },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    replace: true,
                                                },
                                            )
                                        }
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <CardDescription>
                            Komposisi hadir, terlambat, cuti, dan absen per
                            hari.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-wrap gap-2 text-xs">
                            <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                Hadir
                            </div>
                            <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <span className="size-2 rounded-full bg-amber-500" />
                                Terlambat
                            </div>
                            <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <span className="size-2 rounded-full bg-blue-500" />
                                Cuti
                            </div>
                            <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                                <span className="size-2 rounded-full bg-slate-300" />
                                Absen
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="flex min-w-[720px] items-end gap-3">
                                {attendanceChart.map((day) => (
                                    <div
                                        key={day.date}
                                        className="flex flex-1 flex-col items-center gap-2"
                                    >
                                        <div className="flex h-52 w-full max-w-16 items-end overflow-hidden rounded-md border bg-muted/20">
                                            <div className="flex h-full w-full flex-col justify-end">
                                                <div
                                                    className="bg-slate-300"
                                                    style={{
                                                        height: `${(day.absent / maxEmployees) * 100}%`,
                                                    }}
                                                    title={`Absen: ${day.absent}`}
                                                />
                                                <div
                                                    className="bg-blue-500"
                                                    style={{
                                                        height: `${(day.on_leave / maxEmployees) * 100}%`,
                                                    }}
                                                    title={`Cuti: ${day.on_leave}`}
                                                />
                                                <div
                                                    className="bg-amber-500"
                                                    style={{
                                                        height: `${(day.late / maxEmployees) * 100}%`,
                                                    }}
                                                    title={`Terlambat: ${day.late}`}
                                                />
                                                <div
                                                    className="bg-emerald-500"
                                                    style={{
                                                        height: `${(day.present / maxEmployees) * 100}%`,
                                                    }}
                                                    title={`Hadir: ${day.present}`}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium">
                                            {day.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {day.attendance_rate}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
