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
import { index as leavesIndex } from '@/routes/hris/leaves';
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

type LeaveRow = {
    id: number;
    employee_id: number;
    employee_label: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: string;
    reason: string | null;
    status: string;
    rejection_reason: string | null;
};

type LeaveFormData = {
    employee_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    rejection_reason: string;
};

type Filters = {
    status: string;
    employee_id: string;
    date: string;
};

type PageProps = {
    leaves: Paginator<LeaveRow>;
    employees: EmployeeOption[];
    filters: Filters;
    statusOptions: string[];
    typeOptions: string[];
    stats: {
        pending: number;
        approved: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cuti',
        href: leavesIndex(),
    },
];

const defaultForm: LeaveFormData = {
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
    rejection_reason: '',
};

const statusLabelMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

const typeLabelMap: Record<string, string> = {
    annual: 'Tahunan',
    sick: 'Sakit',
    unpaid: 'Tidak Dibayar',
    other: 'Lainnya',
};

export default function LeavePage() {
    const { leaves, employees, filters, statusOptions, typeOptions, stats } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<LeaveRow | null>(null);
    const [detailRow, setDetailRow] = useState<LeaveRow | null>(null);

    const form = useForm<LeaveFormData>(defaultForm);

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    const openCreate = () => {
        setEditingRow(null);
        form.clearErrors();
        form.setData(defaultForm);
        setDialogOpen(true);
    };

    const openEdit = (row: LeaveRow) => {
        setEditingRow(row);
        form.clearErrors();
        form.setData({
            employee_id: String(row.employee_id),
            leave_type: row.leave_type,
            start_date: row.start_date,
            end_date: row.end_date,
            reason: row.reason ?? '',
            status: row.status,
            rejection_reason: row.rejection_reason ?? '',
        });
        setDialogOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingRow) {
            form.put(`/hris/leaves/${editingRow.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingRow(null);
                    form.reset();
                },
            });
            return;
        }

        form.post('/hris/leaves', {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                form.reset();
            },
        });
    };

    const applyFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(leavesIndex.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const leaveExportQuery = new URLSearchParams(
        Object.entries({
            date: filterState.date,
            employee_id: filterState.employee_id,
            status: filterState.status,
        }).filter(([, value]) => value !== ''),
    ).toString();

    const leaveExportUrl =
        leaveExportQuery === ''
            ? '/hris/leaves/export'
            : `/hris/leaves/export?${leaveExportQuery}`;

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            headerActions={
                <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Cuti
                </Button>
            }
        >
            <Head title="Cuti" />

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
                                        router.get(leavesIndex.url(), reset, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        });
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
                            <CardTitle>Daftar Pengajuan</CardTitle>
                            <CardDescription>
                                Tanggal aktif: {filterState.date}
                            </CardDescription>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <a href={leaveExportUrl}>
                                <Download className="size-4" />
                                Export .xls
                            </a>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-3 py-2">Karyawan</th>
                                        <th className="px-3 py-2">Jenis</th>
                                        <th className="px-3 py-2">Tanggal</th>
                                        <th className="px-3 py-2">Durasi</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada pengajuan cuti.
                                            </td>
                                        </tr>
                                    )}
                                    {leaves.data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b align-top"
                                        >
                                            <td className="px-3 py-3">
                                                {row.employee_label}
                                            </td>
                                            <td className="px-3 py-3">
                                                {typeLabelMap[row.leave_type] ??
                                                    row.leave_type}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.start_date} s/d{' '}
                                                {row.end_date}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.total_days} hari
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
                                                        label="Detail cuti"
                                                        icon={Eye}
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDetailRow(row)
                                                        }
                                                    />
                                                    <ActionIconButton
                                                        label="Edit cuti"
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
                            {leaves.links.map((link, index) => (
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
                        <DialogTitle>Detail Cuti</DialogTitle>
                        <DialogDescription>
                            Ringkasan pengajuan cuti karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {detailRow && (
                        <div className="grid gap-2 text-sm">
                            <p>Karyawan: {detailRow.employee_label}</p>
                            <p>
                                Periode: {detailRow.start_date} s/d{' '}
                                {detailRow.end_date}
                            </p>
                            <p>
                                Jenis:{' '}
                                {typeLabelMap[detailRow.leave_type] ??
                                    detailRow.leave_type}
                            </p>
                            <p>Status: {statusLabelMap[detailRow.status]}</p>
                            <p>Total hari: {detailRow.total_days}</p>
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
                            {editingRow ? 'Edit Cuti' : 'Tambah Cuti'}
                        </DialogTitle>
                        <DialogDescription>
                            Input detail pengajuan cuti karyawan.
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
                            <Label htmlFor="leave_type">Jenis Cuti</Label>
                            <Select
                                value={form.data.leave_type}
                                onValueChange={(value) =>
                                    form.setData('leave_type', value)
                                }
                            >
                                <SelectTrigger
                                    id="leave_type"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {typeLabelMap[type] ?? type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.leave_type} />
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
                            <Label htmlFor="start_date">Tanggal Mulai</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={form.data.start_date}
                                onChange={(event) =>
                                    form.setData(
                                        'start_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                            <InputError message={form.errors.start_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="end_date">Tanggal Selesai</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={form.data.end_date}
                                onChange={(event) =>
                                    form.setData('end_date', event.target.value)
                                }
                                required
                            />
                            <InputError message={form.errors.end_date} />
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

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="rejection_reason">
                                Alasan Penolakan
                            </Label>
                            <Input
                                id="rejection_reason"
                                value={form.data.rejection_reason}
                                onChange={(event) =>
                                    form.setData(
                                        'rejection_reason',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.rejection_reason}
                            />
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
