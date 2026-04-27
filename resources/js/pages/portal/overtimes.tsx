import { CircleAlert, TimerReset } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { chips, formatDate, requestApi } from './lib';
import type { PortalLinkMap } from './lib';
import { PortalShell } from './shell';

type Props = {
    pageTitle: string;
};

type PortalSummary = {
    employee: { id: number } | null;
    links: PortalLinkMap;
};

type OvertimePayload = {
    items: Array<{
        id: number;
        work_date: string;
        start_time: string | null;
        end_time: string | null;
        break_minutes: number;
        total_hours: number;
        reason: string | null;
        status: string;
    }>;
};

export default function PortalOvertimesPage({ pageTitle }: Props) {
    const [portal, setPortal] = useState<PortalSummary | null>(null);
    const [items, setItems] = useState<OvertimePayload['items']>([]);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        work_date: '',
        start_time: '',
        end_time: '',
        break_minutes: '0',
        reason: '',
    });

    const loadData = async () => {
        try {
            setError(null);

            const [portalResponse, overtimeResponse] = await Promise.all([
                requestApi<PortalSummary>('/portal/api/summary'),
                requestApi<OvertimePayload>(
                    '/portal/api/overtimes?scope=all&per_page=20',
                ),
            ]);

            setPortal(portalResponse.data);
            setItems(overtimeResponse.data.items);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Data lembur tidak bisa dimuat.',
            );
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!portal?.employee) {
            return;
        }

        try {
            setError(null);

            await requestApi('/portal/api/overtimes', 'POST', {
                employee_id: portal.employee.id,
                work_date: form.work_date,
                start_time: form.start_time,
                end_time: form.end_time,
                break_minutes: Number(form.break_minutes || 0),
                reason: form.reason,
                status: 'pending',
            });

            setForm({
                work_date: '',
                start_time: '',
                end_time: '',
                break_minutes: '0',
                reason: '',
            });
            await loadData();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Pengajuan lembur gagal.',
            );
        }
    };

    return (
        <PortalShell
            title={pageTitle}
            eyebrow="Overtime request"
            description="Ajukan lembur pribadi dan cek status persetujuannya."
            active="overtimes"
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
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-900">
                        <TimerReset className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                            New overtime
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-[-0.04em]">
                            Ajukan lembur
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <input
                        type="date"
                        value={form.work_date}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                work_date: event.target.value,
                            }))
                        }
                        className="h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                        required
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="time"
                            value={form.start_time}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    start_time: event.target.value,
                                }))
                            }
                            className="h-12 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                            required
                        />
                        <input
                            type="time"
                            value={form.end_time}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    end_time: event.target.value,
                                }))
                            }
                            className="h-12 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                            required
                        />
                    </div>
                    <input
                        type="number"
                        min="0"
                        max="480"
                        value={form.break_minutes}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                break_minutes: event.target.value,
                            }))
                        }
                        className="h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                        placeholder="Break minutes"
                    />
                    <textarea
                        value={form.reason}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                reason: event.target.value,
                            }))
                        }
                        className="min-h-28 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none"
                        placeholder="Alasan lembur"
                    />
                    <button
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold text-white"
                    >
                        Kirim pengajuan lembur
                    </button>
                </form>
            </section>

            {error ? (
                <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                </div>
            ) : null}

            <section className="mt-5 rounded-[32px] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                    Submission list
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.04em]">
                    Riwayat lembur
                </h2>

                <div className="mt-5 space-y-3">
                    {items.length ? (
                        items.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-[24px] border border-stone-200/80 bg-stone-50 px-4 py-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {formatDate(item.work_date)}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {item.start_time} - {item.end_time} ·{' '}
                                            {item.total_hours} jam
                                        </p>
                                        {item.reason ? (
                                            <p className="mt-2 text-sm text-slate-600">
                                                {item.reason}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${chips[item.status] ?? 'bg-stone-200 text-stone-800'}`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="rounded-[24px] bg-stone-50 px-4 py-5 text-sm text-slate-500">
                            Belum ada pengajuan lembur.
                        </div>
                    )}
                </div>
            </section>
        </PortalShell>
    );
}
