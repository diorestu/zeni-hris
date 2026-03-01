import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDownWideNarrow,
    CalendarDays,
    Download,
    Eye,
    Filter,
    Pencil,
    Plus,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import ActionIconButton from '@/components/action-icon-button';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as attendancesIndex } from '@/routes/hris/attendances';
import type { BreadcrumbItem } from '@/types';

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginatorLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type EmployeeOption = {
    id: number;
    label: string;
};

type AttendanceRecord = {
    id: number;
    employee_id: number;
    employee_label: string;
    attendance_date: string;
    shift_name: string;
    status: string;
    check_in_at: string | null;
    check_out_at: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    notes: string | null;
};

type AttendanceFormData = {
    employee_id: string;
    attendance_date: string;
    status: string;
    check_in_at: string;
    check_out_at: string;
    notes: string;
};

type Filters = {
    date: string;
    status: string;
    employee_id: string;
    sort_by: 'employee' | 'check_in_at' | 'check_out_at';
    sort_dir: 'asc' | 'desc';
};

type PageProps = {
    attendances: Paginator<AttendanceRecord>;
    employees: EmployeeOption[];
    filters: Filters;
    todaySummary: {
        present: number;
        late: number;
        on_leave: number;
        absent: number;
    };
    statusOptions: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kehadiran',
        href: attendancesIndex(),
    },
];

const statusLabelMap: Record<string, string> = {
    present: 'Hadir',
    late: 'Terlambat',
    on_leave: 'Cuti',
    absent: 'Absen',
};

const defaultAttendanceForm: AttendanceFormData = {
    employee_id: '',
    attendance_date: '',
    status: 'present',
    check_in_at: '',
    check_out_at: '',
    notes: '',
};

export default function AttendancePage() {
    const { attendances, employees, filters, todaySummary, statusOptions } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(
        null,
    );
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
        null,
    );

    const attendanceForm = useForm<AttendanceFormData>(defaultAttendanceForm);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const openCreateDialog = () => {
        setEditingRecord(null);
        attendanceForm.clearErrors();
        attendanceForm.setData(defaultAttendanceForm);
        setDialogOpen(true);
    };

    const openEditDialog = (record: AttendanceRecord) => {
        setEditingRecord(record);
        attendanceForm.clearErrors();
        attendanceForm.setData({
            employee_id: String(record.employee_id),
            attendance_date: record.attendance_date,
            status: record.status,
            check_in_at: record.check_in_at ?? '',
            check_out_at: record.check_out_at ?? '',
            notes: record.notes ?? '',
        });
        setDialogOpen(true);
    };

    const submitAttendance = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingRecord) {
            attendanceForm.put(`/hris/attendances/${editingRecord.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    attendanceForm.reset();
                    setEditingRecord(null);
                },
            });

            return;
        }

        attendanceForm.post('/hris/attendances', {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                attendanceForm.reset();
            },
        });
    };

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(attendancesIndex.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleSort = (sortBy: 'check_in_at' | 'check_out_at') => {
        const nextDir: Filters['sort_dir'] =
            filterState.sort_by === sortBy && filterState.sort_dir === 'asc'
                ? 'desc'
                : 'asc';

        const nextFilter = {
            ...filterState,
            sort_by: sortBy,
            sort_dir: nextDir,
        };

        setFilterState(nextFilter);
        router.get(attendancesIndex.url(), nextFilter, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const attendanceExportQuery = new URLSearchParams(
        Object.entries({
            date: filterState.date,
            status: filterState.status,
            employee_id: filterState.employee_id,
            sort_by: filterState.sort_by,
            sort_dir: filterState.sort_dir,
        }).filter(([, value]) => value !== ''),
    ).toString();

    const attendanceExportUrl =
        attendanceExportQuery === ''
            ? '/hris/attendances/export'
            : `/hris/attendances/export?${attendanceExportQuery}`;

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button size="sm" onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    Input Kehadiran
                </Button>
            }
        >
            <Head title="Kehadiran" />

            <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Hadir Hari Ini</CardDescription>
                            <CardTitle className="text-2xl">
                                {todaySummary.present}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Terlambat</CardDescription>
                            <CardTitle className="text-2xl">
                                {todaySummary.late}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Cuti</CardDescription>
                            <CardTitle className="text-2xl">
                                {todaySummary.on_leave}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Absen</CardDescription>
                            <CardTitle className="text-2xl">
                                {todaySummary.absent}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Data Kehadiran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={applyFilter}
                            className="grid gap-3 md:grid-cols-[200px_220px_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="filter_date">Tanggal</Label>
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="filter_date"
                                        type="date"
                                        value={filterState.date}
                                        onChange={(event) =>
                                            setFilterState((prev) => ({
                                                ...prev,
                                                date: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="filter_status">Status</Label>
                                <Select
                                    value={
                                        filterState.status === ''
                                            ? '__all'
                                            : filterState.status
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((prev) => ({
                                            ...prev,
                                            status:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id="filter_status"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Semua status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">
                                            Semua status
                                        </SelectItem>
                                        {statusOptions.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {statusLabelMap[status] ??
                                                    status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="filter_employee">
                                    Karyawan
                                </Label>
                                <SearchableSelect
                                    id="filter_employee"
                                    value={
                                        filterState.employee_id === ''
                                            ? '__all'
                                            : filterState.employee_id
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((prev) => ({
                                            ...prev,
                                            employee_id:
                                                value === '__all' ? '' : value,
                                        }))
                                    }
                                    placeholder="Semua karyawan"
                                    searchPlaceholder="Cari karyawan..."
                                    options={[
                                        {
                                            value: '__all',
                                            label: 'Semua karyawan',
                                        },
                                        ...employees.map((employee) => ({
                                            value: String(employee.id),
                                            label: employee.label,
                                        })),
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit">
                                    <Filter className="size-4" />
                                    Terapkan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const reset = {
                                            ...filterState,
                                            date: new Date()
                                                .toISOString()
                                                .slice(0, 10),
                                            status: '',
                                            employee_id: '',
                                        };
                                        setFilterState(reset);
                                        router.get(
                                            attendancesIndex.url(),
                                            reset,
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <RotateCcw className="size-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle>Daftar Kehadiran</CardTitle>
                            <CardDescription>
                                Tanggal aktif: {filterState.date}
                            </CardDescription>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <a href={attendanceExportUrl}>
                                <Download className="size-4" />
                                Export .xls
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-3 py-2">Karyawan</th>
                                        <th className="px-3 py-2">Nama Shift</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="-ml-3"
                                                onClick={() =>
                                                    toggleSort('check_in_at')
                                                }
                                            >
                                                Check-in
                                                <ArrowDownWideNarrow className="size-3.5" />
                                            </Button>
                                        </th>
                                        <th className="px-3 py-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="-ml-3"
                                                onClick={() =>
                                                    toggleSort('check_out_at')
                                                }
                                            >
                                                Check-out
                                                <ArrowDownWideNarrow className="size-3.5" />
                                            </Button>
                                        </th>
                                        <th className="px-3 py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada data kehadiran.
                                            </td>
                                        </tr>
                                    )}
                                    {attendances.data.map((row) => (
                                        <tr key={row.id} className="border-b">
                                            <td className="px-3 py-3">
                                                {row.employee_label}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.shift_name}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    variant={
                                                        row.status === 'present'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {statusLabelMap[
                                                        row.status
                                                    ] ?? row.status}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.check_in_time ?? '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.check_out_time ?? '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1.5">
                                                    <ActionIconButton
                                                        label="Detail kehadiran"
                                                        icon={Eye}
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDetailRecord(row)
                                                        }
                                                    />
                                                    <ActionIconButton
                                                        label="Edit kehadiran"
                                                        icon={Pencil}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEditDialog(row)
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {attendances.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    asChild={link.url !== null}
                                    size="sm"
                                    variant={link.active ? 'default' : 'outline'}
                                    disabled={link.url === null}
                                >
                                    {link.url ? (
                                        <Link
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Link>
                                    ) : (
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={detailRecord !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailRecord(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Kehadiran</DialogTitle>
                        <DialogDescription>
                            Informasi detail absensi karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {detailRecord && (
                        <div className="grid gap-2 text-sm">
                            <p>Karyawan: {detailRecord.employee_label}</p>
                            <p>Tanggal: {detailRecord.attendance_date}</p>
                            <p>Nama Shift: {detailRecord.shift_name}</p>
                            <p>
                                Status:{' '}
                                {statusLabelMap[detailRecord.status] ??
                                    detailRecord.status}
                            </p>
                            <p>Check-in: {detailRecord.check_in_time ?? '-'}</p>
                            <p>
                                Check-out: {detailRecord.check_out_time ?? '-'}
                            </p>
                            <p>Catatan: {detailRecord.notes ?? '-'}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        attendanceForm.reset();
                        attendanceForm.clearErrors();
                        setEditingRecord(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRecord
                                ? 'Edit Kehadiran'
                                : 'Input Kehadiran'}
                        </DialogTitle>
                        <DialogDescription>
                            Simpan data absensi untuk karyawan pada tanggal
                            tertentu.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="grid gap-3 md:grid-cols-2"
                        onSubmit={submitAttendance}
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="employee_id">Karyawan</Label>
                            <SearchableSelect
                                id="employee_id"
                                value={
                                    attendanceForm.data.employee_id === ''
                                        ? '__none'
                                        : attendanceForm.data.employee_id
                                }
                                onValueChange={(value) =>
                                    attendanceForm.setData(
                                        'employee_id',
                                        value === '__none' ? '' : value,
                                    )
                                }
                                placeholder="Pilih karyawan"
                                searchPlaceholder="Cari karyawan..."
                                options={[
                                    { value: '__none', label: '-' },
                                    ...employees.map((employee) => ({
                                        value: String(employee.id),
                                        label: employee.label,
                                    })),
                                ]}
                                className="w-full"
                            />
                            <InputError
                                message={attendanceForm.errors.employee_id}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="attendance_date">Tanggal</Label>
                            <Input
                                id="attendance_date"
                                type="date"
                                value={attendanceForm.data.attendance_date}
                                onChange={(event) =>
                                    attendanceForm.setData(
                                        'attendance_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                message={attendanceForm.errors.attendance_date}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="attendance_status">Status</Label>
                            <Select
                                value={attendanceForm.data.status}
                                onValueChange={(value) =>
                                    attendanceForm.setData('status', value)
                                }
                            >
                                <SelectTrigger
                                    id="attendance_status"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabelMap[status] ?? status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={attendanceForm.errors.status}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="check_in_at">Check-in</Label>
                            <Input
                                id="check_in_at"
                                type="datetime-local"
                                value={attendanceForm.data.check_in_at}
                                onChange={(event) =>
                                    attendanceForm.setData(
                                        'check_in_at',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={attendanceForm.errors.check_in_at}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="check_out_at">Check-out</Label>
                            <Input
                                id="check_out_at"
                                type="datetime-local"
                                value={attendanceForm.data.check_out_at}
                                onChange={(event) =>
                                    attendanceForm.setData(
                                        'check_out_at',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={attendanceForm.errors.check_out_at}
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Input
                                id="notes"
                                value={attendanceForm.data.notes}
                                onChange={(event) =>
                                    attendanceForm.setData(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={attendanceForm.errors.notes} />
                        </div>

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={attendanceForm.processing}
                            >
                                {editingRecord ? 'Simpan' : 'Tambah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
