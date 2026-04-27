import { ArrowDownLeft, ArrowUpRight, CircleAlert, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { chips, formatDate, formatTime, requestApi } from './lib';
import type { PortalLinkMap } from './lib';
import { PortalShell } from './shell';

type Props = {
    pageTitle: string;
};

type AttendancePayload = {
    summary: {
        present: number;
        late: number;
        on_leave: number;
        absent: number;
    };
    items: Array<{
        id: number;
        employee_id: number;
        employee_label: string;
        attendance_date: string;
        status: string;
        check_in_at: string | null;
        check_out_at: string | null;
        notes: string | null;
    }>;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

type PortalSummary = {
    today: { date: string; formatted: string };
    employee: { id: number } | null;
    shift_options: Array<{
        id: number;
        code: string;
        name: string;
        start_time: string | null;
        end_time: string | null;
        is_day_off: boolean;
    }>;
    quick_action: {
        shift: {
            id: number;
            code: string;
            name: string;
            start_time: string | null;
            end_time: string | null;
            is_day_off: boolean;
        } | null;
        attendance: {
            id: number;
            attendance_date: string | null;
            status: string;
            shift: {
                id: number;
                code: string;
                name: string;
                start_time: string | null;
                end_time: string | null;
                is_day_off: boolean;
            } | null;
            check_in_at: string | null;
            check_out_at: string | null;
            notes: string | null;
        } | null;
        open_attendance: {
            id: number;
            attendance_date: string | null;
            status: string;
            shift: {
                id: number;
                code: string;
                name: string;
                start_time: string | null;
                end_time: string | null;
                is_day_off: boolean;
            } | null;
            check_in_at: string | null;
            check_out_at: string | null;
            notes: string | null;
        } | null;
        can_clock_in: boolean;
        can_clock_out: boolean;
        hint: string;
    };
    links: PortalLinkMap;
};

type LocationState = 'idle' | 'loading';

type Coordinates = {
    latitude: number;
    longitude: number;
};

const getCurrentLocation = (): Promise<Coordinates> =>
    new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Browser Anda tidak mendukung geolocation.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                if (error.code === 1) {
                    reject(new Error('Akses lokasi ditolak. Aktifkan izin lokasi untuk melanjutkan.'));
                    return;
                }

                if (error.code === 2) {
                    reject(new Error('Lokasi perangkat tidak ditemukan.'));
                    return;
                }

                if (error.code === 3) {
                    reject(new Error('Permintaan lokasi melebihi batas waktu.'));
                    return;
                }

                reject(new Error('Gagal mengambil lokasi perangkat.'));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    });

export default function PortalAttendancePage({ pageTitle }: Props) {
    const [portal, setPortal] = useState<PortalSummary | null>(null);
    const [attendance, setAttendance] = useState<AttendancePayload | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const [locationState, setLocationState] = useState<LocationState>('idle');
    const [selectedShiftId, setSelectedShiftId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setError(null);

            const [portalResponse, attendanceResponse] = await Promise.all([
                requestApi<PortalSummary>('/portal/api/summary'),
                requestApi<AttendancePayload>(
                    `/portal/api/attendances?period=${new Date().toISOString().slice(0, 7)}&per_page=15`,
                ),
            ]);

            setPortal(portalResponse.data);
            setAttendance(attendanceResponse.data);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Data attendance tidak bisa dimuat.',
            );
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    useEffect(() => {
        if (!portal) {
            return;
        }

        const shiftExists = selectedShiftId
            ? portal.shift_options.some((shift) => String(shift.id) === selectedShiftId)
            : false;

        if (!selectedShiftId || !shiftExists) {
            const fallbackShiftId = portal.quick_action.shift && portal.shift_options.some((shift) => shift.id === portal.quick_action.shift?.id)
                ? portal.quick_action.shift.id
                : portal.shift_options[0]?.id;
            setSelectedShiftId(fallbackShiftId ? String(fallbackShiftId) : '');
        }
    }, [portal, selectedShiftId]);

    const selectedShift = portal?.shift_options.find((shift) => String(shift.id) === selectedShiftId) ?? null;
    const currentShift =
        selectedShift ?? portal?.quick_action.shift ?? portal?.quick_action.open_attendance?.shift ?? null;

    const handleClockIn = async () => {
        if (!portal?.employee) {
            return;
        }

        if (!selectedShift) {
            setError('Shift belum tersedia. Pilih shift terlebih dahulu.');
            return;
        }

        try {
            setIsMutating(true);
            setError(null);
            setLocationState('loading');

            const location = await getCurrentLocation();

            await requestApi('/portal/api/attendances', 'POST', {
                employee_id: portal.employee.id,
                shift_id: selectedShift.id,
                attendance_date: portal.today.date,
                status: 'present',
                check_in_at: new Date().toISOString(),
                check_in_latitude: location.latitude,
                check_in_longitude: location.longitude,
            });

            await loadData();
        } catch (mutationError) {
            setError(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Masuk gagal.',
            );
        } finally {
            setLocationState('idle');
            setIsMutating(false);
        }
    };

    const handleClockOut = async () => {
        if (!portal?.employee || !portal.quick_action.open_attendance) {
            return;
        }

        const targetAttendance = portal.quick_action.open_attendance;
        const shiftId =
            targetAttendance.shift?.id ?? selectedShift?.id ?? portal.quick_action.shift?.id;

        if (!shiftId) {
            setError('Shift belum tersedia untuk absensi ini.');
            return;
        }

        try {
            setIsMutating(true);
            setError(null);
            setLocationState('loading');

            const location = await getCurrentLocation();

            await requestApi(
                `/portal/api/attendances/${targetAttendance.id}`,
                'PUT',
                {
                    employee_id: portal.employee.id,
                    shift_id: shiftId,
                    attendance_date: targetAttendance.attendance_date ?? portal.today.date,
                    status: targetAttendance.status,
                    check_in_at: targetAttendance.check_in_at,
                    check_out_at: new Date().toISOString(),
                    check_out_latitude: location.latitude,
                    check_out_longitude: location.longitude,
                    notes: targetAttendance.notes,
                },
            );

            await loadData();
        } catch (mutationError) {
            setError(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Pulang gagal.',
            );
        } finally {
            setLocationState('idle');
            setIsMutating(false);
        }
    };

    return (
        <PortalShell
            title={pageTitle}
            eyebrow="Absensi shift"
            description="Clock in, pulang, dan riwayat kehadiran pribadi."
            active="attendance"
            links={
                portal?.links ?? {
                    attendance: '/portal/attendance',
                    leaves: '/portal/leaves',
                    overtimes: '/portal/overtimes',
                    payroll: '/portal/payroll',
                }
            }
        >
            <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-5 text-slate-900">
                <p className="text-xs tracking-[0.22em] text-white/55 uppercase">
                    Status hari ini
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                    {portal?.today.formatted ?? 'Memuat...'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    {portal?.quick_action.hint ?? 'Memuat status shift.'}
                </p>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                        Shift hari ini
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                        {currentShift
                            ? `${currentShift.name}${currentShift.start_time && currentShift.end_time ? ` • ${currentShift.start_time.slice(0, 5)}-${currentShift.end_time.slice(0, 5)}` : ''}`
                            : 'Belum ada shift yang dipilih'}
                    </p>
                    <div className="mt-3">
                        <label className="mb-2 block text-xs tracking-[0.18em] text-slate-500 uppercase">
                            Pilih shift
                        </label>
                        <select
                            value={selectedShiftId}
                            onChange={(event) => setSelectedShiftId(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">Pilih shift</option>
                            {portal?.shift_options.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                    {shift.name}
                                    {shift.start_time && shift.end_time
                                        ? ` (${shift.start_time.slice(0, 5)}-${shift.end_time.slice(0, 5)})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/60">
                        Lokasi perangkat akan diminta saat clock in atau pulang.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-900">
                        <p className="text-xs text-slate-500">Clock in</p>
                        <p className="mt-1 text-2xl font-bold tracking-[-0.04em]">
                            {formatTime(
                                portal?.quick_action.open_attendance?.check_in_at ??
                                    portal?.quick_action.attendance?.check_in_at ??
                                    null,
                            )}
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs text-slate-500">Pulang</p>
                        <p className="mt-1 text-2xl font-bold tracking-[-0.04em]">
                            {formatTime(
                                portal?.quick_action.open_attendance?.check_out_at ??
                                    portal?.quick_action.attendance?.check_out_at ??
                                    null,
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => void handleClockIn()}
                        disabled={isMutating || locationState === 'loading' || !portal?.quick_action.can_clock_in}
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        <ArrowDownLeft className="size-4" />
                        {locationState === 'loading' ? 'Mengambil lokasi...' : 'Masuk'}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleClockOut()}
                        disabled={isMutating || locationState === 'loading' || !portal?.quick_action.can_clock_out}
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    >
                        <ArrowUpRight className="size-4" />
                        {locationState === 'loading' ? 'Mengambil lokasi...' : 'Pulang'}
                    </button>
                </div>
            </section>

            {error ? (
                <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                </div>
            ) : null}

            <section className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                        Hadir
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">
                        {attendance?.summary.present ?? 0}
                    </p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                        Cuti
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-[-0.05em]">
                        {attendance?.summary.on_leave ?? 0}
                    </p>
                </div>
            </section>

            <section className="mt-5 rounded-[32px] border border-slate-200 bg-white px-5 py-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <History className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                            Riwayat
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-[-0.04em]">
                            Riwayat absensi
                        </h2>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {attendance?.items.length ? (
                        attendance.items.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {formatDate(item.attendance_date)}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Masuk {formatTime(item.check_in_at)} · Keluar{' '}
                                            {formatTime(item.check_out_at)}
                                        </p>
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
                            Belum ada riwayat absensi.
                        </div>
                    )}
                </div>
            </section>
        </PortalShell>
    );
}
