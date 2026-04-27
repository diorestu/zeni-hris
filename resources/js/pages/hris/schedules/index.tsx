import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Filter,
    Plus,
    RefreshCcw,
    Save,
    WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
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
import AppLayout from '@/layouts/app-layout';
import {
    index as schedulesIndex,
    roster as scheduleRoster,
    store as scheduleStore,
} from '@/routes/hris/schedules';
import scheduleShifts from '@/routes/hris/schedules/shifts';
import type { BreadcrumbItem } from '@/types';

type EmployeeOption = {
    id: number;
    label: string;
};

type ScheduleDay = {
    date: string;
    label: string;
    shift_code: string;
    start_time: string | null;
    end_time: string | null;
    is_day_off: boolean;
    notes: string | null;
};

type Filters = {
    month: string;
    employee_id: string;
};

type ShiftTemplate = {
    start_time: string | null;
    end_time: string | null;
    is_day_off: boolean;
};

type ShiftOption = {
    id: number;
    code: string;
    name: string;
    start_time: string | null;
    end_time: string | null;
    is_day_off: boolean;
};

type PageProps = {
    employees: EmployeeOption[];
    filters: Filters;
    shifts: ShiftOption[];
    scheduleDays: ScheduleDay[];
    shiftTemplates: Record<string, ShiftTemplate>;
};

type RosterFormData = {
    employee_id: string;
    start_date: string;
    end_date: string;
    pattern_text: string;
    pattern: string[];
};

type QuickScheduleFormData = {
    employee_id: string;
    work_date: string;
    shift_code: string;
    notes: string;
};

type ShiftFormData = {
    start_time: string;
    end_time: string;
};

type ScheduleRow = {
    date: string;
    label: string;
    shift_code: string;
    start_time: string;
    end_time: string;
    is_day_off: boolean;
    notes: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Kerja',
        href: schedulesIndex(),
    },
];

const buildShiftCodeFromTimes = (
    startTime: string,
    endTime: string,
    isDayOff: boolean,
) => {
    if (isDayOff || startTime === '' || endTime === '') {
        return 'OFF';
    }

    return `${startTime.slice(0, 2)}${endTime.slice(0, 2)}`;
};

const formatShiftTime = (shift: {
    start_time: string | null;
    end_time: string | null;
    is_day_off: boolean;
}) => {
    if (shift.is_day_off) {
        return 'Libur';
    }

    if (shift.start_time === null || shift.end_time === null) {
        return '-';
    }

    return `${shift.start_time} - ${shift.end_time}`;
};

export default function SchedulePage() {
    const { employees, filters, shifts, scheduleDays, shiftTemplates } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [quickDialogOpen, setQuickDialogOpen] = useState(false);
    const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
    const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);

    const shiftOptions = useMemo(
        () =>
            shifts.map((shift) => ({
                value: shift.code,
                label: `${shift.code} - ${formatShiftTime(shift)}`,
                keywords: `${shift.name} ${shift.start_time ?? ''} ${shift.end_time ?? ''}`,
            })),
        [shifts],
    );

    const shiftLookup = useMemo(
        () => new Map(shifts.map((shift) => [shift.code, shift])),
        [shifts],
    );

    const employeeLookup = useMemo(
        () =>
            new Map(
                employees.map((employee) => [String(employee.id), employee.label]),
            ),
        [employees],
    );

    const defaultWorkingShiftCode = useMemo(
        () => shifts.find((shift) => !shift.is_day_off)?.code ?? shifts[0]?.code ?? '',
        [shifts],
    );

    const rosterPatternPlaceholder = useMemo(
        () =>
            shifts
                .slice(0, 4)
                .map((shift) => shift.code)
                .join(',') || '0817,0918,1701,OFF',
        [shifts],
    );

    const rosterForm = useForm<RosterFormData>({
        employee_id: filters.employee_id,
        start_date: `${filters.month}-01`,
        end_date: `${filters.month}-07`,
        pattern_text: rosterPatternPlaceholder,
        pattern: [],
    });

    const quickScheduleForm = useForm<QuickScheduleFormData>({
        employee_id: filters.employee_id,
        work_date: `${filters.month}-01`,
        shift_code: defaultWorkingShiftCode,
        notes: '',
    });

    const shiftForm = useForm<ShiftFormData>({
        start_time: '08:00',
        end_time: '17:00',
    });

    useEffect(() => {
        setFilterState(filters);
    }, [filters]);

    useEffect(() => {
        setScheduleRows(
            scheduleDays.map((day) => ({
                date: day.date,
                label: day.label,
                shift_code: day.shift_code,
                start_time: day.start_time ?? '',
                end_time: day.end_time ?? '',
                is_day_off: day.is_day_off,
                notes: day.notes ?? '',
            })),
        );
    }, [scheduleDays]);

    const applyShiftSelection = (shiftCode: string): ShiftTemplate => {
        return (
            shiftTemplates[shiftCode] ?? {
                start_time: null,
                end_time: null,
                is_day_off: true,
            }
        );
    };

    const applyFilter = () => {
        router.get(schedulesIndex.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openQuickScheduleDialog = () => {
        quickScheduleForm.clearErrors();
        quickScheduleForm.setData({
            employee_id: filterState.employee_id,
            work_date: `${filterState.month}-01`,
            shift_code: defaultWorkingShiftCode,
            notes: '',
        });
        setQuickDialogOpen(true);
    };

    const openRosterDialog = () => {
        rosterForm.clearErrors();
        rosterForm.setData({
            employee_id: filterState.employee_id,
            start_date: `${filterState.month}-01`,
            end_date: `${filterState.month}-07`,
            pattern_text: rosterPatternPlaceholder,
            pattern: [],
        });
        setRosterDialogOpen(true);
    };

    const openShiftDialog = () => {
        shiftForm.clearErrors();
        shiftForm.setData({
            start_time: '08:00',
            end_time: '17:00',
        });
        setShiftDialogOpen(true);
    };

    const updateRowShift = (index: number, shiftCode: string) => {
        const selectedShift = applyShiftSelection(shiftCode);

        setScheduleRows((prev) =>
            prev.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          shift_code: shiftCode,
                          start_time: selectedShift.start_time ?? '',
                          end_time: selectedShift.end_time ?? '',
                          is_day_off: selectedShift.is_day_off,
                      }
                    : item,
            ),
        );
    };

    const saveSchedule = () => {
        router.post(
            scheduleStore.url(),
            {
                employee_id: filterState.employee_id,
                month: filterState.month,
                entries: scheduleRows.map((row) => ({
                    date: row.date,
                    shift_code: row.shift_code,
                    start_time: row.start_time || null,
                    end_time: row.end_time || null,
                    is_day_off: row.is_day_off,
                    notes: row.notes || null,
                })),
            },
            {
                preserveScroll: true,
            },
        );
    };

    const applyRoster = () => {
        const pattern = rosterForm.data.pattern_text
            .split(',')
            .map((item) => item.trim().toUpperCase())
            .filter((item) => item !== '');

        rosterForm.transform((data) => ({
            employee_id: data.employee_id,
            start_date: data.start_date,
            end_date: data.end_date,
            pattern,
        }));

        rosterForm.post(scheduleRoster.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setRosterDialogOpen(false);
            },
        });
    };

    const saveQuickSchedule = () => {
        const selectedShift = applyShiftSelection(quickScheduleForm.data.shift_code);

        quickScheduleForm.transform((data) => ({
            employee_id: data.employee_id,
            month: data.work_date.slice(0, 7),
            entries: [
                {
                    date: data.work_date,
                    shift_code: data.shift_code,
                    start_time: selectedShift.start_time,
                    end_time: selectedShift.end_time,
                    is_day_off: selectedShift.is_day_off,
                    notes: data.notes || null,
                },
            ],
        }));

        quickScheduleForm.post(scheduleStore.url(), {
            preserveScroll: true,
            onSuccess: () => {
                const nextFilters = {
                    month: quickScheduleForm.data.work_date.slice(0, 7),
                    employee_id: quickScheduleForm.data.employee_id,
                };

                setQuickDialogOpen(false);
                setFilterState(nextFilters);
                quickScheduleForm.reset();

                router.get(schedulesIndex.url(), nextFilters, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            },
        });
    };

    const saveShift = () => {
        shiftForm.post(scheduleShifts.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setShiftDialogOpen(false);
                router.get(schedulesIndex.url(), filterState, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            },
        });
    };

    const quickShift = shiftLookup.get(quickScheduleForm.data.shift_code);
    const shiftPreviewCode = buildShiftCodeFromTimes(
        shiftForm.data.start_time,
        shiftForm.data.end_time,
        false,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Kerja" />

            <div className="space-y-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle>Filter Jadwal</CardTitle>
                            <CardDescription>
                                Pilih karyawan dan bulan untuk melihat jadwal kerja.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={openShiftDialog}>
                                <Plus className="size-4" />
                                Tambah Shift
                            </Button>
                            <Button type="button" variant="outline" onClick={openRosterDialog}>
                                <WandSparkles className="size-4" />
                                Roster Shift Otomatis
                            </Button>
                            <Button type="button" onClick={openQuickScheduleDialog}>
                                <Plus className="size-4" />
                                Tambah Jam Kerja
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-[220px_260px_auto]">
                            <div className="grid gap-2">
                                <Label htmlFor="filter_month">Bulan</Label>
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="filter_month"
                                        type="month"
                                        value={filterState.month}
                                        onChange={(event) =>
                                            setFilterState((prev) => ({
                                                ...prev,
                                                month: event.target.value,
                                            }))
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="filter_employee">Karyawan</Label>
                                <SearchableSelect
                                    id="filter_employee"
                                    value={
                                        filterState.employee_id === ''
                                            ? '__none'
                                            : filterState.employee_id
                                    }
                                    onValueChange={(value) =>
                                        setFilterState((prev) => ({
                                            ...prev,
                                            employee_id: value === '__none' ? '' : value,
                                        }))
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
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="button" onClick={applyFilter}>
                                    <Filter className="size-4" />
                                    Tampilkan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const reset = {
                                            month: new Date().toISOString().slice(0, 7),
                                            employee_id: employees[0]
                                                ? String(employees[0].id)
                                                : '',
                                        };

                                        setFilterState(reset);
                                        router.get(schedulesIndex.url(), reset, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        });
                                    }}
                                >
                                    <RefreshCcw className="size-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Shift Tersedia</CardTitle>
                        <CardDescription>
                            Shift yang ditambahkan di popup akan muncul di sini dan bisa dipilih
                            pada jadwal bulanan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-2 py-2">Kode</th>
                                        <th className="px-2 py-2">Nama</th>
                                        <th className="px-2 py-2">Jam Kerja</th>
                                        <th className="px-2 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.map((shift) => (
                                        <tr key={shift.id} className="border-b">
                                            <td className="px-2 py-2 font-medium">
                                                {shift.code}
                                            </td>
                                            <td className="px-2 py-2">{shift.name}</td>
                                            <td className="px-2 py-2">
                                                {formatShiftTime(shift)}
                                            </td>
                                            <td className="px-2 py-2">
                                                {shift.is_day_off ? 'Day Off' : 'Aktif'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle>Schedule Bulanan</CardTitle>
                            <CardDescription>
                                Karyawan: {employeeLookup.get(filterState.employee_id) ?? '-'} |
                                {' '}Bulan: {filterState.month}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={saveSchedule}
                            disabled={scheduleRows.length === 0 || filterState.employee_id === ''}
                        >
                            <Save className="size-4" />
                            Simpan Jadwal
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-2 py-2">Tanggal</th>
                                        <th className="px-2 py-2">Kode Shift</th>
                                        <th className="px-2 py-2">Jam Masuk</th>
                                        <th className="px-2 py-2">Jam Pulang</th>
                                        <th className="px-2 py-2">Status</th>
                                        <th className="px-2 py-2">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduleRows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-2 py-6 text-center text-muted-foreground"
                                            >
                                                Tidak ada jadwal pada filter ini.
                                            </td>
                                        </tr>
                                    )}
                                    {scheduleRows.map((row, index) => (
                                        <tr key={row.date} className="border-b">
                                            <td className="px-2 py-2">{row.label}</td>
                                            <td className="px-2 py-2">
                                                <SearchableSelect
                                                    value={row.shift_code}
                                                    onValueChange={(value) =>
                                                        updateRowShift(index, value)
                                                    }
                                                    placeholder="Pilih shift"
                                                    searchPlaceholder="Cari kode shift..."
                                                    options={shiftOptions}
                                                    className="min-w-[220px]"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input value={row.start_time} readOnly />
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input value={row.end_time} readOnly />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                {row.is_day_off ? 'Day Off' : 'Kerja'}
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    value={row.notes}
                                                    onChange={(event) =>
                                                        setScheduleRows((prev) =>
                                                            prev.map((item, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...item,
                                                                          notes: event.target.value,
                                                                      }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Opsional"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={shiftDialogOpen}
                onOpenChange={(open) => {
                    setShiftDialogOpen(open);
                    if (!open) {
                        shiftForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Shift</DialogTitle>
                        <DialogDescription>
                            Kode shift akan dibuat otomatis dari jam mulai dan jam selesai.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="shift_start_time">Jam Mulai</Label>
                            <Input
                                id="shift_start_time"
                                type="time"
                                value={shiftForm.data.start_time}
                                onChange={(event) =>
                                    shiftForm.setData('start_time', event.target.value)
                                }
                            />
                            <InputError message={shiftForm.errors.start_time} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="shift_end_time">Jam Selesai</Label>
                            <Input
                                id="shift_end_time"
                                type="time"
                                value={shiftForm.data.end_time}
                                onChange={(event) =>
                                    shiftForm.setData('end_time', event.target.value)
                                }
                            />
                            <InputError message={shiftForm.errors.end_time} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="shift_preview_code">Preview Kode Shift</Label>
                            <Input
                                id="shift_preview_code"
                                value={shiftPreviewCode}
                                readOnly
                                className="font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShiftDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={saveShift}
                            disabled={shiftForm.processing}
                        >
                            <Save className="size-4" />
                            Simpan Shift
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={rosterDialogOpen}
                onOpenChange={(open) => {
                    setRosterDialogOpen(open);
                    if (!open) {
                        rosterForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Roster Shift Otomatis</DialogTitle>
                        <DialogDescription>
                            Generate jadwal berdasarkan pola kode shift. Contoh:
                            {' '}`{rosterPatternPlaceholder}`.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="roster_employee">Karyawan</Label>
                            <SearchableSelect
                                id="roster_employee"
                                value={
                                    rosterForm.data.employee_id === ''
                                        ? '__none'
                                        : rosterForm.data.employee_id
                                }
                                onValueChange={(value) =>
                                    rosterForm.setData(
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
                            <InputError message={rosterForm.errors.employee_id} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="pattern_text">Pola Shift</Label>
                            <Input
                                id="pattern_text"
                                value={rosterForm.data.pattern_text}
                                onChange={(event) =>
                                    rosterForm.setData('pattern_text', event.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Shift tersedia: {shifts.map((shift) => shift.code).join(', ')}
                            </p>
                            <InputError message={rosterForm.errors.pattern} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Tanggal Mulai</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={rosterForm.data.start_date}
                                onChange={(event) =>
                                    rosterForm.setData('start_date', event.target.value)
                                }
                            />
                            <InputError message={rosterForm.errors.start_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="end_date">Tanggal Selesai</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={rosterForm.data.end_date}
                                onChange={(event) =>
                                    rosterForm.setData('end_date', event.target.value)
                                }
                            />
                            <InputError message={rosterForm.errors.end_date} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRosterDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={applyRoster}
                            disabled={rosterForm.processing}
                        >
                            <WandSparkles className="size-4" />
                            Terapkan Roster
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={quickDialogOpen}
                onOpenChange={(open) => {
                    setQuickDialogOpen(open);
                    if (!open) {
                        quickScheduleForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tambah Jam Kerja</DialogTitle>
                        <DialogDescription>
                            Tambahkan satu entri jadwal dengan memilih shift yang sudah tersedia.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="quick_employee">Karyawan</Label>
                            <SearchableSelect
                                id="quick_employee"
                                value={
                                    quickScheduleForm.data.employee_id === ''
                                        ? '__none'
                                        : quickScheduleForm.data.employee_id
                                }
                                onValueChange={(value) =>
                                    quickScheduleForm.setData(
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
                            <InputError message={quickScheduleForm.errors.employee_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quick_work_date">Tanggal</Label>
                            <Input
                                id="quick_work_date"
                                type="date"
                                value={quickScheduleForm.data.work_date}
                                onChange={(event) =>
                                    quickScheduleForm.setData('work_date', event.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quick_shift_code">Kode Shift</Label>
                            <SearchableSelect
                                id="quick_shift_code"
                                value={quickScheduleForm.data.shift_code}
                                onValueChange={(value) =>
                                    quickScheduleForm.setData('shift_code', value)
                                }
                                placeholder="Pilih shift"
                                searchPlaceholder="Cari shift..."
                                options={shiftOptions}
                                className="w-full"
                            />
                            <InputError message={quickScheduleForm.errors.shift_code} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Jam Masuk</Label>
                            <Input value={quickShift?.start_time ?? ''} readOnly />
                        </div>

                        <div className="grid gap-2">
                            <Label>Jam Pulang</Label>
                            <Input value={quickShift?.end_time ?? ''} readOnly />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>Status Shift</Label>
                            <Input value={quickShift?.is_day_off ? 'Day Off' : 'Hari Kerja'} readOnly />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="quick_notes">Catatan</Label>
                            <Input
                                id="quick_notes"
                                value={quickScheduleForm.data.notes}
                                onChange={(event) =>
                                    quickScheduleForm.setData('notes', event.target.value)
                                }
                                placeholder="Opsional"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setQuickDialogOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={saveQuickSchedule}
                            disabled={quickScheduleForm.processing}
                        >
                            <Save className="size-4" />
                            Simpan Jam Kerja
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
