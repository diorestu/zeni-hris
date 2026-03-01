import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
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
import { index as overtimesIndex } from '@/routes/hris/overtimes';
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

type OvertimeRow = {
    id: number;
    employee_id: number;
    employee_label: string;
    work_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    total_hours: string;
    reason: string | null;
    status: string;
    notes: string | null;
};

type OvertimeFormData = {
    employee_id: string;
    work_date: string;
    start_time: string;
    end_time: string;
    break_minutes: string;
    reason: string;
    status: string;
    notes: string;
};

type Filters = {
    status: string;
    employee_id: string;
    date: string;
};

type PageProps = {
    overtimes: Paginator<OvertimeRow>;
    employees: EmployeeOption[];
    filters: Filters;
    statusOptions: string[];
    stats: {
        pending: number;
        approved: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Lembur',
        href: overtimesIndex(),
    },
];

const defaultForm: OvertimeFormData = {
    employee_id: '',
    work_date: '',
    start_time: '18:00',
    end_time: '20:00',
    break_minutes: '0',
    reason: '',
    status: 'pending',
    notes: '',
};

const statusLabelMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

export default function OvertimePage() {
    const { overtimes, employees, filters, statusOptions, stats } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<OvertimeRow | null>(null);
    const [detailRow, setDetailRow] = useState<OvertimeRow | null>(null);

    const form = useForm<OvertimeFormData>(defaultForm);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const openCreate = () => {
        setEditingRow(null);
        form.clearErrors();
        form.setData(defaultForm);
        setDialogOpen(true);
    };

    const openEdit = (row: OvertimeRow) => {
        setEditingRow(row);
        form.clearErrors();
        form.setData({
            employee_id: String(row.employee_id),
            work_date: row.work_date,
            start_time: row.start_time,
            end_time: row.end_time,
            break_minutes: String(row.break_minutes),
            reason: row.reason ?? '',
            status: row.status,
            notes: row.notes ?? '',
        });
        setDialogOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingRow) {
            form.put(`/hris/overtimes/${editingRow.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingRow(null);
                    form.reset();
                },
            });
            return;
        }

        form.post('/hris/overtimes', {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                form.reset();
            },
        });
    };

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(overtimesIndex.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const overtimeExportQuery = new URLSearchParams(
        Object.entries({
            date: filterState.date,
            employee_id: filterState.employee_id,
            status: filterState.status,
        }).filter(([, value]) => value !== ''),
    ).toString();

    const overtimeExportUrl =
        overtimeExportQuery === ''
            ? '/hris/overtimes/export'
            : `/hris/overtimes/export?${overtimeExportQuery}`;

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Lembur
                </Button>
            }
        >
            <Head title="Lembur" />

            <div className="space-y-4 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Pending</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.pending}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Approved</CardDescription>
                            <CardTitle className="text-2xl">
                                {stats.approved}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={applyFilter}
                            className="grid gap-3 md:grid-cols-[220px_220px_160px_auto]"
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
                                    placeholder="Semua"
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
                                        <SelectValue placeholder="Semua" />
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
                                            date: new Date()
                                                .toISOString()
                                                .slice(0, 10),
                                            employee_id: '',
                                            status: '',
                                        };
                                        setFilterState(reset);
                                        router.get(
                                            overtimesIndex.url(),
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
                            <CardTitle>Daftar Lembur</CardTitle>
                            <CardDescription>
                                Tanggal aktif: {filterState.date}
                            </CardDescription>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <a href={overtimeExportUrl}>
                                <Download className="size-4" />
                                Export .xls
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1040px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-3 py-2">Karyawan</th>
                                        <th className="px-3 py-2">Tanggal</th>
                                        <th className="px-3 py-2">Jam</th>
                                        <th className="px-3 py-2">Break</th>
                                        <th className="px-3 py-2">Total</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overtimes.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada data lembur.
                                            </td>
                                        </tr>
                                    )}
                                    {overtimes.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b align-top"
                                        >
                                            <td className="px-3 py-3">
                                                {row.employee_label}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.work_date}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.start_time} -{' '}
                                                {row.end_time}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.break_minutes} menit
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.total_hours} jam
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    variant={
                                                        row.status ===
                                                        'approved'
                                                            ? 'default'
                                                            : row.status ===
                                                                'rejected'
                                                              ? 'destructive'
                                                              : 'secondary'
                                                    }
                                                >
                                                    {statusLabelMap[
                                                        row.status
                                                    ] ?? row.status}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1.5">
                                                    <ActionIconButton
                                                        label="Detail lembur"
                                                        icon={Eye}
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDetailRow(row)
                                                        }
                                                    />
                                                    <ActionIconButton
                                                        label="Edit lembur"
                                                        icon={Pencil}
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEdit(row)
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
                            {overtimes.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    asChild={link.url !== null}
                                    size="sm"
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
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
                open={detailRow !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailRow(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Lembur</DialogTitle>
                        <DialogDescription>
                            Ringkasan data lembur karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {detailRow && (
                        <div className="grid gap-2 text-sm">
                            <p>Karyawan: {detailRow.employee_label}</p>
                            <p>Tanggal: {detailRow.work_date}</p>
                            <p>
                                Jam: {detailRow.start_time} -{' '}
                                {detailRow.end_time}
                            </p>
                            <p>Break: {detailRow.break_minutes} menit</p>
                            <p>Total: {detailRow.total_hours} jam</p>
                            <p>
                                Status:{' '}
                                {statusLabelMap[detailRow.status] ??
                                    detailRow.status}
                            </p>
                            <p>Alasan: {detailRow.reason ?? '-'}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditingRow(null);
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRow ? 'Edit Lembur' : 'Tambah Lembur'}
                        </DialogTitle>
                        <DialogDescription>
                            Input detail lembur karyawan.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="grid gap-3 md:grid-cols-2"
                        onSubmit={submitForm}
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="employee">Karyawan</Label>
                            <SearchableSelect
                                id="employee"
                                value={
                                    form.data.employee_id === ''
                                        ? '__none'
                                        : form.data.employee_id
                                }
                                onValueChange={(value) =>
                                    form.setData(
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
                            <InputError message={form.errors.employee_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="work_date">Tanggal</Label>
                            <Input
                                id="work_date"
                                type="date"
                                value={form.data.work_date}
                                onChange={(event) =>
                                    form.setData(
                                        'work_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                            <InputError message={form.errors.work_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData('status', value)
                                }
                            >
                                <SelectTrigger id="status" className="w-full">
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
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="start_time">Jam Mulai</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={form.data.start_time}
                                onChange={(event) =>
                                    form.setData(
                                        'start_time',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                            <InputError message={form.errors.start_time} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="end_time">Jam Selesai</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={form.data.end_time}
                                onChange={(event) =>
                                    form.setData('end_time', event.target.value)
                                }
                                required
                            />
                            <InputError message={form.errors.end_time} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="break_minutes">Break (menit)</Label>
                            <Input
                                id="break_minutes"
                                type="number"
                                min="0"
                                value={form.data.break_minutes}
                                onChange={(event) =>
                                    form.setData(
                                        'break_minutes',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.break_minutes} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Input
                                id="notes"
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                            />
                            <InputError message={form.errors.notes} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="reason">Alasan</Label>
                            <Input
                                id="reason"
                                value={form.data.reason}
                                onChange={(event) =>
                                    form.setData('reason', event.target.value)
                                }
                            />
                            <InputError message={form.errors.reason} />
                        </div>

                        <div className="flex justify-end gap-2 md:col-span-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editingRow ? 'Simpan' : 'Tambah'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
