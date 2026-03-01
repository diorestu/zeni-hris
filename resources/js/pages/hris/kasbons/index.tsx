import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Filter, HandCoins, Pencil, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import {
    destroy as kasbonsDestroy,
    index as kasbonsIndex,
    store as kasbonsStore,
    update as kasbonsUpdate,
} from '@/routes/hris/kasbons';
import type { BreadcrumbItem } from '@/types';

type KasbonItem = {
    id: number;
    employee_id: number;
    employee_label: string;
    amount: string;
    deduction_date: string;
    notes: string | null;
};

type EmployeeOption = {
    id: number;
    label: string;
};

type KasbonFormData = {
    employee_id: string;
    amount: string;
    deduction_date: string;
    notes: string;
    period: string;
};

type PageProps = {
    period: string;
    kasbons: KasbonItem[];
    employeeOptions: EmployeeOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kasbon',
        href: kasbonsIndex(),
    },
];

const formatCurrency = (value: null | number | string) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
};

const parseEmployeeLabel = (label: string) => {
    const [code, ...nameParts] = label.split(' - ');

    return {
        code: code ?? '-',
        name: nameParts.join(' - ') || label,
    };
};

const periodStartDate = (period: string) => {
    if (/^\d{4}-\d{2}$/.test(period)) {
        return `${period}-01`;
    }

    return new Date().toISOString().slice(0, 10);
};

export default function KasbonPage() {
    const { period, kasbons, employeeOptions } = usePage<PageProps>().props;

    const [periodState, setPeriodState] = useState(period);
    const [editingKasbon, setEditingKasbon] = useState<KasbonItem | null>(null);

    const kasbonForm = useForm<KasbonFormData>({
        employee_id: '',
        amount: '',
        deduction_date: periodStartDate(period),
        notes: '',
        period,
    });

    const summary = useMemo(() => {
        return {
            totalEntries: kasbons.length,
            totalAmount: kasbons.reduce(
                (sum, kasbon) => sum + Number(kasbon.amount ?? 0),
                0,
            ),
        };
    }, [kasbons]);

    const applyPeriodFilter = () => {
        router.get(
            kasbonsIndex.url(),
            { period: periodState },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetKasbonForm = () => {
        setEditingKasbon(null);
        kasbonForm.clearErrors();
        kasbonForm.setData({
            employee_id: '',
            amount: '',
            deduction_date: periodStartDate(periodState),
            notes: '',
            period: periodState,
        });
    };

    const openKasbonEdit = (kasbon: KasbonItem) => {
        setEditingKasbon(kasbon);
        kasbonForm.clearErrors();
        kasbonForm.setData({
            employee_id: String(kasbon.employee_id),
            amount: String(Number(kasbon.amount ?? 0)),
            deduction_date: kasbon.deduction_date,
            notes: kasbon.notes ?? '',
            period: periodState,
        });
    };

    const submitKasbonForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        kasbonForm.setData('period', periodState);

        if (editingKasbon) {
            kasbonForm.put(kasbonsUpdate.url(editingKasbon.id), {
                preserveScroll: true,
                onSuccess: () => {
                    resetKasbonForm();
                },
            });
            return;
        }

        kasbonForm.post(kasbonsStore.url(), {
            preserveScroll: true,
            onSuccess: () => {
                resetKasbonForm();
            },
        });
    };

    const handleDeleteKasbon = (kasbonId: number) => {
        router.delete(kasbonsDestroy.url(kasbonId), {
            data: { period: periodState },
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kasbon" />

            <div className="space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HandCoins className="size-4" />
                            Manajemen Kasbon
                        </CardTitle>
                        <CardDescription>
                            Kelola kasbon per karyawan. Data kasbon akan
                            dipakai otomatis sebagai potongan saat generate
                            payroll sesuai periode.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grid w-[220px] shrink-0 gap-2">
                                <Label htmlFor="period">Periode</Label>
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="period"
                                        type="month"
                                        value={periodState}
                                        onChange={(event) =>
                                            setPeriodState(event.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={applyPeriodFilter}
                                className="whitespace-nowrap"
                            >
                                <Filter className="size-4" />
                                Terapkan Periode
                            </Button>
                        </div>

                        <form
                            onSubmit={submitKasbonForm}
                            className="grid gap-3 lg:grid-cols-[minmax(240px,1.2fr)_180px_180px_minmax(220px,1fr)_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="kasbon_employee">Karyawan</Label>
                                <SearchableSelect
                                    id="kasbon_employee"
                                    value={
                                        kasbonForm.data.employee_id === ''
                                            ? '__none'
                                            : kasbonForm.data.employee_id
                                    }
                                    onValueChange={(value) =>
                                        kasbonForm.setData(
                                            'employee_id',
                                            value === '__none' ? '' : value,
                                        )
                                    }
                                    placeholder="Pilih karyawan"
                                    searchPlaceholder="Cari karyawan..."
                                    options={[
                                        {
                                            value: '__none',
                                            label: 'Pilih karyawan',
                                        },
                                        ...employeeOptions.map((employee) => ({
                                            value: String(employee.id),
                                            label: employee.label,
                                        })),
                                    ]}
                                    className="w-full"
                                />
                                <InputError
                                    message={kasbonForm.errors.employee_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kasbon_date">Tanggal</Label>
                                <Input
                                    id="kasbon_date"
                                    type="date"
                                    value={kasbonForm.data.deduction_date}
                                    onChange={(event) =>
                                        kasbonForm.setData(
                                            'deduction_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={kasbonForm.errors.deduction_date}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kasbon_amount">
                                    Nominal Kasbon
                                </Label>
                                <Input
                                    id="kasbon_amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={kasbonForm.data.amount}
                                    onChange={(event) =>
                                        kasbonForm.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="0"
                                />
                                <InputError message={kasbonForm.errors.amount} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kasbon_notes">Catatan</Label>
                                <Input
                                    id="kasbon_notes"
                                    value={kasbonForm.data.notes}
                                    onChange={(event) =>
                                        kasbonForm.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                                <InputError message={kasbonForm.errors.notes} />
                            </div>

                            <div className="flex flex-wrap items-end gap-2 pb-[2px]">
                                <Button
                                    type="submit"
                                    disabled={
                                        kasbonForm.processing ||
                                        kasbonForm.data.employee_id === '' ||
                                        kasbonForm.data.amount === '' ||
                                        kasbonForm.data.deduction_date === ''
                                    }
                                >
                                    {kasbonForm.processing
                                        ? 'Menyimpan...'
                                        : editingKasbon
                                          ? 'Update Kasbon'
                                          : 'Tambah Kasbon'}
                                </Button>
                                {editingKasbon && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetKasbonForm}
                                    >
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </form>

                        <div className="rounded-lg border">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-sm">
                                <p className="font-medium">
                                    Daftar Kasbon Periode {period}
                                </p>
                                <p className="text-muted-foreground">
                                    {summary.totalEntries} entri • Total{' '}
                                    {formatCurrency(summary.totalAmount)}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[860px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-2">Tanggal</th>
                                            <th className="px-3 py-2">Karyawan</th>
                                            <th className="px-3 py-2">Catatan</th>
                                            <th className="px-3 py-2">Nominal</th>
                                            <th className="px-3 py-2 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kasbons.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-3 py-6 text-center text-muted-foreground"
                                                >
                                                    Belum ada kasbon di periode
                                                    ini.
                                                </td>
                                            </tr>
                                        )}
                                        {kasbons.map((kasbon) => (
                                            <tr
                                                key={kasbon.id}
                                                className="border-b align-top"
                                            >
                                                <td className="px-3 py-3">
                                                    {kasbon.deduction_date}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {
                                                        parseEmployeeLabel(
                                                            kasbon.employee_label,
                                                        ).name
                                                    }
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            parseEmployeeLabel(
                                                                kasbon.employee_label,
                                                            ).code
                                                        }
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    {kasbon.notes?.trim() !== ''
                                                        ? kasbon.notes
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-3 font-medium">
                                                    {formatCurrency(kasbon.amount)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                openKasbonEdit(
                                                                    kasbon,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        'Hapus data kasbon ini?',
                                                                    )
                                                                ) {
                                                                    handleDeleteKasbon(
                                                                        kasbon.id,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
