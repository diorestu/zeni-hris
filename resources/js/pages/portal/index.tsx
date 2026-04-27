import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    BellRing,
    CalendarDays,
    ChevronRight,
    CircleAlert,
    CircleCheckBig,
    Clock3,
    House,
    LogOut,
    Plus,
    ScanLine,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { startTransition, useEffect, useMemo, useState } from 'react';

type MobileResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

type PortalSummary = {
    user: {
        id: number;
        name: string;
        email: string;
        role: string | null;
    };
    today: {
        date: string;
        formatted: string;
    };
    employee: {
        id: number;
        employee_code: string;
        full_name: string;
        email: string | null;
        employment_status: string | null;
        employment_type: string | null;
        division: {
            id: number;
            name: string;
        } | null;
        position: {
            id: number;
            name: string;
        } | null;
    } | null;
    quick_action: {
        attendance: {
            id: number;
            attendance_date: string | null;
            status: string;
            check_in_at: string | null;
            check_out_at: string | null;
            notes: string | null;
        } | null;
        can_clock_in: boolean;
        can_clock_out: boolean;
        hint: string;
    };
    cards: {
        annual_leave_days: number;
        sick_leave_days: number;
        payroll_preview: {
            period: string;
            is_saved: boolean;
            generated_at: string | null;
            net_salary: string | null;
        };
    };
    timeline: Array<{
        id: string;
        type: string;
        date: string;
        month_label: string;
        day_label: string;
        title: string;
        subtitle: string;
        chip: string;
    }>;
    links: {
        attendance: string;
        leaves: string;
        overtimes: string;
        payroll: string;
        dashboard: string;
    };
};

type RequestMethod = 'GET' | 'POST' | 'PUT';

const chips: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-900',
    late: 'bg-amber-100 text-amber-900',
    on_leave: 'bg-sky-100 text-sky-900',
    absent: 'bg-rose-100 text-rose-900',
    pending: 'bg-stone-200 text-stone-800',
    approved: 'bg-emerald-100 text-emerald-900',
    rejected: 'bg-rose-100 text-rose-900',
    cancelled: 'bg-stone-200 text-stone-800',
    saved: 'bg-zinc-900 text-white',
    draft: 'bg-stone-200 text-stone-800',
};

const quickLinks = [
    {
        key: 'attendance',
        label: 'Attendance',
    description: 'Absen & riwayat',
        icon: ScanLine,
        tileClass:
            'from-cyan-200 via-sky-100 to-white text-sky-900 shadow-[0_18px_28px_rgba(14,165,233,0.24)]',
    },
    {
        key: 'leaves',
        label: 'Leave',
    description: 'Ajukan cuti',
        icon: CalendarDays,
        tileClass:
            'from-amber-200 via-orange-100 to-white text-amber-900 shadow-[0_18px_28px_rgba(245,158,11,0.22)]',
    },
    {
        key: 'overtimes',
        label: 'Overtime',
    description: 'Ajukan lembur',
        icon: Clock3,
        tileClass:
            'from-violet-200 via-fuchsia-100 to-white text-violet-900 shadow-[0_18px_28px_rgba(139,92,246,0.22)]',
    },
    {
        key: 'payroll',
        label: 'Payroll',
    description: 'Slip gaji',
        icon: Wallet,
        tileClass:
            'from-emerald-200 via-teal-100 to-white text-emerald-900 shadow-[0_18px_28px_rgba(16,185,129,0.22)]',
    },
] as const;

const formatTime = (value: string | null) => {
    if (!value) {
        return '--:--';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
};

async function requestApi<T>(
    url: string,
    method: RequestMethod = 'GET',
    body?: Record<string, unknown>,
): Promise<MobileResponse<T>> {
    const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(xsrfCookie
                ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) }
                : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json()) as MobileResponse<T>;

    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Request failed.');
    }

    return payload;
}

export default function PortalPage() {
    const [summary, setSummary] = useState<PortalSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [quickActionOpen, setQuickActionOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadSummary = async () => {
            try {
                setError(null);

                const response = await requestApi<PortalSummary>('/portal/api/summary');

                if (cancelled) {
                    return;
                }

                startTransition(() => {
                    setSummary(response.data);
                    setIsLoading(false);
                });
            } catch (loadError) {
                if (cancelled) {
                    return;
                }

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Portal data could not be loaded.',
                );
                setIsLoading(false);
            }
        };

        void loadSummary();

        return () => {
            cancelled = true;
        };
    }, []);

    const refreshSummary = async () => {
        const response =
            await requestApi<PortalSummary>('/portal/api/summary');

        startTransition(() => {
            setSummary(response.data);
        });
    };

    const handleClockIn = async () => {
        if (!summary?.employee) {
            return;
        }

        try {
            setIsMutating(true);
            setNotice(null);
            setError(null);

            await requestApi('/portal/api/attendances', 'POST', {
                employee_id: summary.employee.id,
                attendance_date: summary.today.date,
                status: 'present',
                check_in_at: new Date().toISOString(),
            });

            setNotice('Clock in berhasil direkam.');
            await refreshSummary();
        } catch (mutationError) {
            setError(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Clock in gagal.',
            );
        } finally {
            setIsMutating(false);
        }
    };

    const handleClockOut = async () => {
        if (!summary?.employee || !summary.quick_action.attendance) {
            return;
        }

        const attendance = summary.quick_action.attendance;

        try {
            setIsMutating(true);
            setNotice(null);
            setError(null);

            await requestApi(`/portal/api/attendances/${attendance.id}`, 'PUT', {
                employee_id: summary.employee.id,
                attendance_date:
                    attendance.attendance_date ?? summary.today.date,
                status: attendance.status,
                check_in_at: attendance.check_in_at,
                check_out_at: new Date().toISOString(),
                notes: attendance.notes,
            });

            setNotice('Jam pulang berhasil direkam.');
            await refreshSummary();
        } catch (mutationError) {
            setError(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Jam pulang gagal.',
            );
        } finally {
            setIsMutating(false);
        }
    };

    const headlineName =
        summary?.employee?.full_name ?? summary?.user.name ?? 'Pengguna';
    const shiftChipClass =
        chips[summary?.quick_action.attendance?.status ?? 'pending'] ??
        'bg-stone-200 text-stone-800';
    const workingDays = useMemo(() => {
        if (!summary?.today.date) {
            return 0;
        }

        const today = new Date(summary.today.date);
        const year = today.getFullYear();
        const month = today.getMonth();
        let total = 0;

        for (let day = 1; day <= today.getDate(); day += 1) {
            const current = new Date(year, month, day);
            const weekDay = current.getDay();

            if (weekDay !== 0 && weekDay !== 6) {
                total += 1;
            }
        }

        return total;
    }, [summary?.today.date]);

    const announcements = useMemo(() => {
        return (summary?.timeline ?? []).slice(0, 4);
    }, [summary?.timeline]);

    return (
        <>
            <Head title="Employee App">
                <meta name="theme-color" content="#0f172a" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />
                <meta
                    name="apple-mobile-web-app-title"
                    content={import.meta.env.VITE_APP_NAME || 'PaperTime'}
                />
                <link rel="manifest" href="/manifest.webmanifest" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-white text-slate-900">
                <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white px-4 pb-28 pt-4 sm:max-w-lg">
                    <section className="rounded-[36px] border border-slate-200 bg-white px-5 py-6 text-slate-900">
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs tracking-[0.24em] text-slate-500 uppercase">
                                        APP. {import.meta.env.VITE_APP_NAME || 'PaperTime'}
                                    </p>
                                    <h1
                                        className="mt-2 text-3xl font-extrabold tracking-[-0.05em]"
                                        style={{
                                            fontFamily:
                                                'Manrope, ui-sans-serif, system-ui, sans-serif',
                                        }}
                                    >
                                        {headlineName}
                                    </h1>
                                    <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-600">
                                        {summary?.today.formatted ??
                                            'Memuat portal hari ini.'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="inline-flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white/70 text-slate-900 backdrop-blur"
                                        aria-label="Logout"
                                    >
                                        <LogOut className="size-4" />
                                    </Link>
                                </div>
                            </div>

                                <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                            Status shift
                                        </p>
                                        <p className="mt-2 text-lg font-semibold">
                                            {summary?.quick_action.hint ??
                                                'Memuat status absensi.'}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${shiftChipClass}`}
                                    >
                                        {summary?.quick_action.attendance
                                            ?.status ?? 'pending'}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-900">
                                        <p className="text-xs text-slate-500">
                                            Clock in
                                        </p>
                                        <p className="mt-1 text-xl font-bold tracking-[-0.03em]">
                                            {formatTime(
                                                summary?.quick_action.attendance
                                                    ?.check_in_at ?? null,
                                            )}
                                        </p>
                                    </div>
                                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-900">
                                        <p className="text-xs text-slate-500">
                                            Jam pulang
                                        </p>
                                        <p className="mt-1 text-xl font-bold tracking-[-0.03em]">
                                            {formatTime(
                                                summary?.quick_action.attendance
                                                    ?.check_out_at ?? null,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleClockIn()}
                                        disabled={
                                            isMutating ||
                                            !summary?.quick_action.can_clock_in
                                        }
                                            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ArrowDownLeft className="size-4" />
                                        Clock in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleClockOut()}
                                        disabled={
                                            isMutating ||
                                            !summary?.quick_action.can_clock_out
                                        }
                                            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ArrowUpRight className="size-4" />
                                        Pulang
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {!isLoading ? (
                        <section className="mt-5 grid grid-cols-4 gap-3">
                            {quickLinks.map((item) => {
                                const href =
                                    summary?.links[
                                        item.key as keyof PortalSummary['links']
                                    ] ?? '#';

                                return (
                                    <a
                                        key={item.key}
                                        href={href}
                                        className="group text-center"
                                    >
                                        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-[22px] border border-white/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_18px_rgba(15,23,42,0.12)]">
                                            <div
                                                className={`inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tileClass}`}
                                            >
                                                <item.icon className="size-6" />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[13px] font-semibold text-slate-900">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                            {item.description}
                                        </p>
                                    </a>
                                );
                            })}
                        </section>
                    ) : null}

                    {error ? (
                        <div className="mt-4 flex items-start gap-3 rounded-[26px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    ) : null}

                    {notice ? (
                        <div className="mt-4 flex items-start gap-3 rounded-[26px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                            <CircleCheckBig className="mt-0.5 size-4 shrink-0" />
                            <p>{notice}</p>
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="mt-5 space-y-3">
                            <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
                            <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
                            <div className="h-52 animate-pulse rounded-[28px] bg-white/70" />
                        </div>
                    ) : null}

                    {!isLoading ? (
                        <>
                            <section className="mt-5 rounded-[32px] border border-slate-200 bg-white px-5 py-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                            Overview
                                        </p>
                                        <h2
                                            className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950"
                                            style={{
                                                fontFamily:
                                                    'Manrope, ui-sans-serif, system-ui, sans-serif',
                                            }}
                                        >
                                            Hari kerja kamu
                                        </h2>
                                    </div>
                                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                        <Sparkles className="size-5" />
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                                            <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                                                Sisa cuti
                                            </p>
                                            <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                                                {summary?.cards.annual_leave_days ??
                                                    0}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                hari
                                            </p>
                                        </div>
                                        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                                            <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                                                Hari kerja
                                            </p>
                                            <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                                                {workingDays}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                hari bulan ini
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="mt-5 rounded-[32px] border border-slate-200 bg-white px-5 py-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                            Notifikasi
                                        </p>
                                        <h2
                                            className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-slate-950"
                                            style={{
                                                fontFamily:
                                                    'Manrope, ui-sans-serif, system-ui, sans-serif',
                                            }}
                                        >
                                            Pengumuman
                                        </h2>
                                    </div>
                                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#eefbf7] text-teal-700">
                                        <BellRing className="size-5" />
                                    </span>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {announcements.length ? (
                                        announcements.map((item) => (
                                            <article
                                                key={item.id}
                                                className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                                            >
                                                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-[20px] bg-white py-2 text-slate-900">
                                                    <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                                        {item.month_label}
                                                    </span>
                                                    <span className="text-xl font-bold tracking-[-0.04em]">
                                                        {item.day_label}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {item.title}
                                                            </p>
                                                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                                                {item.subtitle}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${chips[item.chip] ?? 'bg-stone-200 text-stone-800'}`}
                                                        >
                                                            {item.chip}
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))
                                    ) : (
                                        <div className="rounded-[24px] bg-stone-50 px-4 py-5 text-sm text-slate-500">
                                            Belum ada pengumuman terbaru.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    ) : null}

                    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4 sm:max-w-lg">
                        <div className="relative grid grid-cols-5 gap-2 rounded-[28px] border border-white/70 bg-white/86 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                            {quickActionOpen ? (
                                <div className="absolute inset-x-8 bottom-20 rounded-[24px] border border-white/70 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                                    <div className="grid gap-2">
                                        <a
                                            href={summary?.links.leaves ?? '#'}
                                            className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan cuti
                                        </a>
                                        <a
                                            href={`${summary?.links.leaves ?? '/portal/leaves'}?type=sick`}
                                            className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan sakit
                                        </a>
                                        <a
                                            href={summary?.links.overtimes ?? '#'}
                                            className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-900"
                                        >
                                            Ajukan lembur
                                        </a>
                                    </div>
                                </div>
                            ) : null}
                            <a
                                href="/portal"
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] bg-slate-950 text-white"
                            >
                                <House className="size-4" />
                                <span className="text-[11px] font-semibold">
                                    Home
                                </span>
                            </a>
                            <a
                                href={summary?.links.attendance ?? '#'}
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] text-slate-600"
                            >
                                <Clock3 className="size-4" />
                                <span className="text-[11px] font-semibold">
                                    Shift
                                </span>
                            </a>
                            <button
                                type="button"
                                onClick={() =>
                                    setQuickActionOpen((current) => !current)
                                }
                                className="-mt-8 inline-flex size-16 items-center justify-center self-start justify-self-center rounded-full bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.28)]"
                            >
                                <Plus className="size-6" />
                            </button>
                            <a
                                href={summary?.links.leaves ?? '#'}
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] text-slate-600"
                            >
                                <CalendarDays className="size-4" />
                                <span className="text-[11px] font-semibold">
                                    Leave
                                </span>
                            </a>
                            <a
                                href={summary?.links.payroll ?? '#'}
                                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] text-slate-600"
                            >
                                <Wallet className="size-4" />
                                <span className="text-[11px] font-semibold">
                                    Payroll
                                </span>
                            </a>
                        </div>
                    </nav>

                    <section className="mt-5 hidden rounded-[32px] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.07)] md:block">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                                    More
                                </p>
                                <h2
                                    className="mt-2 text-2xl font-extrabold tracking-[-0.04em]"
                                    style={{
                                        fontFamily:
                                            'Manrope, ui-sans-serif, system-ui, sans-serif',
                                    }}
                                >
                                    Desktop shortcuts
                                </h2>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                            {quickLinks.map((item) => {
                                const href =
                                    summary?.links[
                                        item.key as keyof PortalSummary['links']
                                    ] ?? '#';

                                return (
                                    <a
                                        key={`desktop-${item.key}`}
                                        href={href}
                                        className="flex items-center justify-between rounded-[24px] bg-stone-50 px-4 py-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-slate-700">
                                                <item.icon className="size-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                            {item.label}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-slate-400" />
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
