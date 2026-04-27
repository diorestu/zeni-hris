import { CircleAlert, PlaneTakeoff } from 'lucide-react';
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

type LeavePayload = {
    items: Array<{
        id: number;
        leave_type: string;
        start_date: string;
        end_date: string;
        total_days: number;
        reason: string | null;
        status: string;
        rejection_reason: string | null;
    }>;
};

export default function PortalLeavesPage({ pageTitle }: Props) {
    const [portal, setPortal] = useState<PortalSummary | null>(null);
    const [items, setItems] = useState<LeavePayload['items']>([]);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        leave_type:
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('type') === 'sick'
                ? 'sick'
                : 'annual',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const loadData = async () => {
        try {
            setError(null);

            const [portalResponse, leavesResponse] = await Promise.all([
                requestApi<PortalSummary>('/portal/api/summary'),
                requestApi<LeavePayload>(
                    '/portal/api/leaves?scope=all&per_page=20',
                ),
            ]);

            setPortal(portalResponse.data);
            setItems(leavesResponse.data.items);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Data cuti tidak bisa dimuat.',
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

            await requestApi('/portal/api/leaves', 'POST', {
                employee_id: portal.employee.id,
                leave_type: form.leave_type,
                start_date: form.start_date,
                end_date: form.end_date,
                reason: form.reason,
                status: 'pending',
            });

            setForm({
                leave_type: 'annual',
                start_date: '',
                end_date: '',
                reason: '',
            });
            await loadData();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Pengajuan cuti gagal.',
            );
        }
    };

    return (
        <PortalShell
            title={pageTitle}
            eyebrow="Leave request"
            description="Ajukan cuti pribadi dan pantau status persetujuannya."
            active="leaves"
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
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                        <PlaneTakeoff className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                            New request
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-[-0.04em]">
                            Ajukan cuti
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <select
                        value={form.leave_type}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                leave_type: event.target.value,
                            }))
                        }
                        className="h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                    >
                        <option value="annual">Annual leave</option>
                        <option value="sick">Sick leave</option>
                        <option value="unpaid">Unpaid leave</option>
                        <option value="other">Other</option>
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            value={form.start_date}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    start_date: event.target.value,
                                }))
                            }
                            className="h-12 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                            required
                        />
                        <input
                            type="date"
                            value={form.end_date}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    end_date: event.target.value,
                                }))
                            }
                            className="h-12 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm outline-none"
                            required
                        />
                    </div>
                    <textarea
                        value={form.reason}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                reason: event.target.value,
                            }))
                        }
                        className="min-h-28 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none"
                        placeholder="Alasan cuti"
                    />
                    <button
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold text-white"
                    >
                        Kirim pengajuan
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
                    Riwayat pengajuan
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
                                            {item.leave_type}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatDate(item.start_date)} -{' '}
                                            {formatDate(item.end_date)} · {item.total_days}{' '}
                                            hari
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
                            Belum ada pengajuan cuti.
                        </div>
                    )}
                </div>
            </section>
        </PortalShell>
    );
}
