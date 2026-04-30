import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Calculator,
    Coins,
    Filter,
    Send,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import AppLayout from '@/layouts/app-layout';
import {
    generate as generatePayroll,
    index as payrollsIndex,
    save as savePayroll,
    sendPayslips,
} from '@/routes/hris/payrolls';
import type { BreadcrumbItem } from '@/types';

type PayrollRun = {
    id: number;
    period: string;
    period_start: string;
    period_end: string;
    generated_at: string | null;
    is_saved: boolean;
    saved_at: string | null;
    employees_count: number;
    total_base_salary: string;
    total_allowances: string;
    total_deductions: string;
    total_net_salary: string;
};

type PayrollItem = {
    id: number;
    employee_id: number;
    employee_label: string;
    can_send_payslip: boolean;
    base_salary: string;
    allowances_total: string;
    pph21_method: string | null;
    pph21_rate: string | number;
    pph21_allowance: string | number;
    pph21_deduction: string | number;
    pph21_company_borne: string | number;
    kasbon_deduction: string;
    denda_deduction: string;
    deductions_total: string;
    net_salary: string;
    allowance_breakdown: Record<string, number>;
};

type PageProps = {
    period: string;
    run: PayrollRun | null;
    items: PayrollItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: payrollsIndex(),
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

const pph21Label = (method: string | null) => {
    if (method === 'ter_harian') {
        return 'TER Harian';
    }

    if (method === 'gross') {
        return 'Gross';
    }

    if (method === 'net') {
        return 'Net';
    }

    if (method === 'gross_up') {
        return 'Gross Up';
    }

    return '-';
};

export default function PayrollPage() {
    const { period, run, items } = usePage<PageProps>().props;

    const [periodState, setPeriodState] = useState(period);
    const [sendingPayslips, setSendingPayslips] = useState(false);
    const [sendingPayslipItemIds, setSendingPayslipItemIds] = useState<
        number[]
    >([]);
    const generateForm = useForm({
        period,
    });

    const totals = useMemo(() => {
        if (run) {
            return {
                employees: run.employees_count,
                gross:
                    Number(run.total_base_salary ?? 0) +
                    Number(run.total_allowances ?? 0),
                deductions: Number(run.total_deductions ?? 0),
                net: Number(run.total_net_salary ?? 0),
            };
        }

        const gross = items.reduce(
            (sum, item) =>
                sum +
                Number(item.base_salary ?? 0) +
                Number(item.allowances_total ?? 0),
            0,
        );
        const deductions = items.reduce(
            (sum, item) => sum + Number(item.deductions_total ?? 0),
            0,
        );
        const net = items.reduce(
            (sum, item) => sum + Number(item.net_salary ?? 0),
            0,
        );

        return {
            employees: items.length,
            gross,
            deductions,
            net,
        };
    }, [items, run]);

    const applyPeriodFilter = () => {
        router.get(
            payrollsIndex.url(),
            {
                period: periodState,
            },
            {
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleGenerate = () => {
        generateForm.setData('period', periodState);
        generateForm.post(generatePayroll.url(), {
            preserveScroll: true,
        });
    };

    const handleSave = () => {
        if (!run) {
            return;
        }

        router.post(
            savePayroll.url(run.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleSendPayslips = () => {
        if (!run) {
            return;
        }

        setSendingPayslips(true);

        router.post(
            sendPayslips.url(run.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setSendingPayslips(false),
            },
        );
    };

    const handleSendPayslip = (item: PayrollItem) => {
        if (!run) {
            return;
        }

        setSendingPayslipItemIds((current) => [...current, item.id]);

        router.post(
            `/hris/payrolls/${run.id}/items/${item.id}/send-payslip`,
            {},
            {
                preserveScroll: true,
                onFinish: () =>
                    setSendingPayslipItemIds((current) =>
                        current.filter((id) => id !== item.id),
                    ),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />

            <div className="space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Payroll</CardTitle>
                        <CardDescription>
                            Pilih periode payroll, lalu sistem akan
                            auto-generate dari gaji pokok, tunjangan aktif,
                            serta potongan kasbon dan denda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={applyPeriodFilter}
                                    className="whitespace-nowrap"
                                >
                                    <Filter className="size-4" />
                                    Lihat Preview
                                </Button>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={
                                        generateForm.processing ||
                                        periodState === ''
                                    }
                                    className="whitespace-nowrap"
                                >
                                    <Calculator className="size-4" />
                                    {generateForm.processing
                                        ? 'Memproses...'
                                        : 'Generate Payroll'}
                                </Button>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleSave}
                                    disabled={!run || run.is_saved}
                                    className="whitespace-nowrap"
                                >
                                    <Sparkles className="size-4" />
                                    {run?.is_saved
                                        ? 'Payroll Tersimpan'
                                        : 'Simpan Payroll'}
                                </Button>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSendPayslips}
                                    disabled={
                                        !run ||
                                        !run.is_saved ||
                                        items.length === 0 ||
                                        sendingPayslips
                                    }
                                    className="whitespace-nowrap"
                                >
                                    <Send className="size-4" />
                                    {sendingPayslips
                                        ? 'Masuk queue...'
                                        : 'Kirim Payslip WA'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Jumlah Karyawan</CardDescription>
                            <CardTitle className="text-2xl">
                                {totals.employees}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Bruto</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(totals.gross)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Potongan</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(totals.deductions)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="gap-2 py-3">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>
                                Total Take Home Pay
                            </CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(totals.net)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Preview Payroll {periodState}</CardTitle>
                        <CardDescription>
                            {run?.generated_at
                                ? run.is_saved
                                    ? `Generated ${run.generated_at} • Disimpan ${run.saved_at ?? '-'}`
                                    : `Generated pada ${run.generated_at} • Belum disimpan`
                                : 'Belum ada data payroll untuk periode ini. Klik "Generate Payroll".'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1320px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="sticky left-0 z-20 bg-background px-3 py-2">
                                            Karyawan
                                        </th>
                                        <th className="px-3 py-2">
                                            Gaji Pokok
                                        </th>
                                        <th className="px-3 py-2">Tunjangan</th>
                                        <th className="px-3 py-2">PPh21</th>
                                        <th className="px-3 py-2">Kasbon</th>
                                        <th className="px-3 py-2">Denda</th>
                                        <th className="px-3 py-2">
                                            Total Potongan
                                        </th>
                                        <th className="px-3 py-2">
                                            Take Home Pay
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-3 py-8 text-center text-muted-foreground"
                                            >
                                                Belum ada data payroll di
                                                periode ini.
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b align-top"
                                        >
                                            <td className="sticky left-0 z-10 bg-background px-3 py-3 font-medium">
                                                <div className="leading-tight">
                                                    <p className="text-sm font-medium">
                                                        {
                                                            parseEmployeeLabel(
                                                                item.employee_label,
                                                            ).name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            parseEmployeeLabel(
                                                                item.employee_label,
                                                            ).code
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatCurrency(
                                                    item.base_salary,
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="font-medium">
                                                    {formatCurrency(
                                                        item.allowances_total,
                                                    )}
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {Object.keys(
                                                        item.allowance_breakdown ??
                                                            {},
                                                    ).length === 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Tanpa tunjangan
                                                        </span>
                                                    )}
                                                    {Object.entries(
                                                        item.allowance_breakdown ??
                                                            {},
                                                    ).map(([name, amount]) => (
                                                        <Badge
                                                            key={`${item.id}-${name}`}
                                                            variant="secondary"
                                                            className="text-[11px]"
                                                        >
                                                            <Coins className="size-3" />
                                                            {name}:{' '}
                                                            {formatCurrency(
                                                                amount,
                                                            )}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {pph21Label(
                                                            item.pph21_method,
                                                        )}{' '}
                                                        ·{' '}
                                                        {Number(
                                                            item.pph21_rate ??
                                                                0,
                                                        )}
                                                        %
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Potongan:{' '}
                                                        {formatCurrency(
                                                            item.pph21_deduction,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Tunjangan:{' '}
                                                        {formatCurrency(
                                                            item.pph21_allowance,
                                                        )}
                                                    </p>
                                                    {Number(
                                                        item.pph21_company_borne ??
                                                            0,
                                                    ) > 0 ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Ditanggung
                                                            perusahaan:{' '}
                                                            {formatCurrency(
                                                                item.pph21_company_borne,
                                                            )}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatCurrency(
                                                    item.kasbon_deduction,
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatCurrency(
                                                    item.denda_deduction,
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatCurrency(
                                                    item.deductions_total,
                                                )}
                                            </td>
                                            <td className="px-3 py-3 font-semibold">
                                                <span className="inline-flex items-center gap-1">
                                                    <Sparkles className="size-4 text-emerald-600" />
                                                    {formatCurrency(
                                                        item.net_salary,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleSendPayslip(item)
                                                    }
                                                    disabled={
                                                        !run?.is_saved ||
                                                        !item.can_send_payslip ||
                                                        sendingPayslipItemIds.includes(
                                                            item.id,
                                                        )
                                                    }
                                                    className="whitespace-nowrap"
                                                >
                                                    <Send className="size-4" />
                                                    {sendingPayslipItemIds.includes(
                                                        item.id,
                                                    )
                                                        ? 'Queue...'
                                                        : 'Kirim WA'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
