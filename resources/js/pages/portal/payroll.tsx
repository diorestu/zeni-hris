import { CircleAlert, Download, ReceiptText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate, requestApi } from './lib';
import type { PortalLinkMap } from './lib';
import { PortalShell } from './shell';

type Props = {
    pageTitle: string;
};

type PortalSummary = {
    links: PortalLinkMap;
};

type PayrollPayload = {
    period: string;
    run: {
        id: number;
        period_start: string | null;
        period_end: string | null;
        is_saved: boolean;
        generated_at: string | null;
    } | null;
    items: Array<{
        id: number;
        employee_label: string;
        base_salary: string | number;
        allowances_total: string | number;
        pph21_method: string | null;
        pph21_rate: string | number;
        pph21_allowance: string | number;
        pph21_deduction: string | number;
        pph21_company_borne: string | number;
        kasbon_deduction: string | number;
        denda_deduction: string | number;
        deductions_total: string | number;
        net_salary: string | number;
        allowance_breakdown: Record<string, number>;
    }>;
};

export default function PortalPayrollPage({ pageTitle }: Props) {
    const [portal, setPortal] = useState<PortalSummary | null>(null);
    const [payroll, setPayroll] = useState<PayrollPayload | null>(null);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [error, setError] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState('');
    const [exportError, setExportError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    const loadData = useCallback(async (activePeriod: string) => {
        try {
            setError(null);

            const [portalResponse, payrollResponse] = await Promise.all([
                requestApi<PortalSummary>('/portal/api/summary'),
                requestApi<PayrollPayload>(
                    `/portal/api/payrolls/preview?period=${activePeriod}`,
                ),
            ]);

            setPortal(portalResponse.data);
            setPayroll(payrollResponse.data);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Slip gaji tidak bisa dimuat.',
            );
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData(period);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData, period]);

    const handleExport = useCallback(async () => {
        if (!birthDate) {
            setExportError('Tanggal lahir wajib diisi sebelum unduh slip gaji.');

            return;
        }

        try {
            setIsExporting(true);
            setExportError(null);

            const response = await fetch(
                `/portal/payroll/export?period=${encodeURIComponent(period)}&birth_date=${encodeURIComponent(birthDate)}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/pdf, application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                const contentType = response.headers.get('content-type') ?? '';

                if (contentType.includes('application/json')) {
                    const payload = (await response.json()) as {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };

                    throw new Error(
                        payload.errors?.birth_date?.[0] ??
                            payload.message ??
                            'Slip gaji tidak bisa diunduh.',
                    );
                }

                throw new Error('Slip gaji tidak bisa diunduh.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename =
                response.headers
                    .get('content-disposition')
                    ?.match(/filename="?([^";]+)"?/)?.[1] ??
                `Payslip_${period.replace('-', '')}.pdf`;

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setIsExportDialogOpen(false);
        } catch (exportLoadError) {
            setExportError(
                exportLoadError instanceof Error
                    ? exportLoadError.message
                    : 'Slip gaji tidak bisa diunduh.',
            );
        } finally {
            setIsExporting(false);
        }
    }, [birthDate, period]);

    const slip = payroll?.items[0] ?? null;

    return (
        <PortalShell
            title={pageTitle}
            eyebrow="Payroll slip"
            description="Lihat slip gaji pribadi per periode payroll."
            active="payroll"
            links={
                portal?.links ?? {
                    attendance: '/portal/attendance',
                    leaves: '/portal/leaves',
                    overtimes: '/portal/overtimes',
                    payroll: '/portal/payroll',
                }
            }
        >
            <section className="rounded-[32px] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
                                <ReceiptText className="size-5" />
                            </span>
                            <div>
                                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                    Selected period
                                </p>
                                <h2 className="mt-1 text-xl font-bold tracking-[-0.04em]">
                                    Slip gaji
                        </h2>
                    </div>
                </div>

                <div className="mt-5 flex gap-3">
                    <input
                        type="month"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                        className="h-12 flex-1 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void loadData(period)}
                        className="inline-flex h-12 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-semibold text-white"
                    >
                        Muat
                    </button>
                </div>
            </section>

            {error ? (
                <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                </div>
            ) : null}

            {slip ? (
                <>
                    <section className="mt-5 rounded-[32px] border border-slate-200 bg-white px-5 py-5 text-slate-900">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                    Net salary
                                </p>
                                <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em]">
                                    {formatCurrency(slip.net_salary)}
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    {payroll?.run?.period_start
                                        ? `${formatDate(payroll.run.period_start)} - ${formatDate(payroll.run.period_end)}`
                                        : payroll?.period}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setExportError(null);
                                    setIsExportDialogOpen(true);
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
                            >
                                <Download className="size-4" />
                                Export
                            </button>
                        </div>
                    </section>

                    <section className="mt-5 rounded-[32px] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                            Payslip preview
                        </p>
                        <div className="mt-4 overflow-hidden rounded-[28px] border border-stone-200">
                            <div className="bg-slate-950 px-5 py-5 text-white">
                                <p className="text-xs tracking-[0.22em] text-white/55 uppercase">
                                    Official payslip
                                </p>
                                <h3 className="mt-2 text-2xl font-bold tracking-[-0.05em]">
                                    {payroll?.period}
                                </h3>
                                <p className="mt-2 text-sm text-white/70">
                                    Draft slip gaji untuk periode terpilih
                                </p>
                            </div>

                            <div className="space-y-5 bg-white px-5 py-5">
                                <div className="grid gap-3 rounded-[24px] bg-stone-50 p-4 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">
                                            Karyawan
                                        </span>
                                        <span className="text-right font-semibold text-slate-900">
                                            {slip.employee_label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">
                                            Periode
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {payroll?.run?.period_start
                                                ? `${formatDate(payroll.run.period_start)} - ${formatDate(payroll.run.period_end)}`
                                                : payroll?.period}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-slate-500">
                                            Status
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {payroll?.run?.is_saved
                                                ? 'Final'
                                                : 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                        Earnings
                                    </p>
                                    <div className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>Gaji pokok</span>
                                            <span className="font-semibold">
                                                {formatCurrency(slip.base_salary)}
                                            </span>
                                        </div>
                                        {Object.entries(
                                            slip.allowance_breakdown ?? {},
                                        ).map(([name, amount]) => (
                                            <div
                                                key={name}
                                                className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3"
                                            >
                                                <span>{name}</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between rounded-[20px] bg-emerald-50 px-4 py-3">
                                            <span>Total tunjangan</span>
                                            <span className="font-semibold text-emerald-900">
                                                {formatCurrency(
                                                    slip.allowances_total,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                        Deductions
                                    </p>
                                    <div className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>PPh21</span>
                                            <span className="font-semibold">
                                                {Number(slip.pph21_rate ?? 0)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>Potongan PPh21</span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    slip.pph21_deduction,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>Tunjangan PPh21</span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    slip.pph21_allowance,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>Kasbon</span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    slip.kasbon_deduction,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[20px] bg-stone-50 px-4 py-3">
                                            <span>Denda</span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    slip.denda_deduction,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[20px] bg-rose-50 px-4 py-3">
                                            <span>Total potongan</span>
                                            <span className="font-semibold text-rose-900">
                                                {formatCurrency(
                                                    slip.deductions_total,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                                    <p className="text-xs tracking-[0.22em] text-white/55 uppercase">
                                        Take home pay
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-[-0.05em]">
                                        {formatCurrency(slip.net_salary)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <section className="mt-5 rounded-[32px] bg-white px-5 py-8 text-sm text-slate-500 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
                    Slip gaji untuk periode ini belum tersedia.
                </section>
            )}

            <Dialog
                open={isExportDialogOpen}
                onOpenChange={(open) => {
                    setIsExportDialogOpen(open);

                    if (!open) {
                        setExportError(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Verifikasi tanggal lahir</DialogTitle>
                        <DialogDescription>
                            Masukkan tanggal lahir yang terdaftar untuk mengunduh slip gaji PDF periode {period}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Label htmlFor="birth_date">Tanggal lahir</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={birthDate}
                            onChange={(event) => setBirthDate(event.target.value)}
                            max={new Date().toISOString().slice(0, 10)}
                        />
                        {exportError ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                                {exportError}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsExportDialogOpen(false)}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-200 px-4 text-sm font-medium text-slate-700"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleExport()}
                            disabled={isExporting}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {isExporting ? 'Mengunduh...' : 'Unduh PDF'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PortalShell>
    );
}
