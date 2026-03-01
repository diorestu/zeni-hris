import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Filter,
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
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    index as schedulesIndex,
    roster as scheduleRoster,
    store as scheduleStore,
} from '@/routes/hris/schedules';
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

type PageProps = {
    employees: EmployeeOption[];
    filters: Filters;
    shiftOptions: string[];
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Kerja',
        href: schedulesIndex(),
    },
];

export default function SchedulePage() {
    const { employees, filters, shiftOptions, scheduleDays, shiftTemplates } =
        usePage<PageProps>().props;

    const [filterState, setFilterState] = useState<Filters>(filters);
    const [scheduleRows, setScheduleRows] = useState<
        Array<{
            date: string;
            label: string;
            shift_code: string;
            start_time: string;
            end_time: string;
            is_day_off: boolean;
            notes: string;
        }>
    >([]);

    const rosterForm = useForm<RosterFormData>({
        employee_id: filters.employee_id,
        start_date: `${filters.month}-01`,
        end_date: `${filters.month}-07`,
        pattern_text: 'SHIFT_A,SHIFT_B,SHIFT_C,OFF',
        pattern: [],
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

    const employeeLookup = useMemo(() => {
        return new Map(
            employees.map((employee) => [String(employee.id), employee.label]),
        );
    }, [employees]);

    const applyFilter = () => {
        router.get(schedulesIndex.url(), filterState, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
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
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Kerja" />

            <div className="space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Jadwal</CardTitle>
                        <CardDescription>
                            Pilih karyawan dan bulan untuk melihat jadwal kerja.
                        </CardDescription>
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
                                <Label htmlFor="filter_employee">
                                    Karyawan
                                </Label>
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
                                            employee_id:
                                                value === '__none' ? '' : value,
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
                                            month: new Date()
                                                .toISOString()
                                                .slice(0, 7),
                                            employee_id: employees[0]
                                                ? String(employees[0].id)
                                                : '',
                                        };
                                        setFilterState(reset);
                                        router.get(
                                            schedulesIndex.url(),
                                            reset,
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
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
                        <CardTitle>Roster Shift Otomatis</CardTitle>
                        <CardDescription>
                            Generate jadwal berdasarkan pola shift. Contoh pola:
                            `SHIFT_A,SHIFT_B,SHIFT_C,OFF`.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="roster_employee">
                                    Karyawan
                                </Label>
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
                                <InputError
                                    message={rosterForm.errors.employee_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pattern_text">Pola Shift</Label>
                                <Input
                                    id="pattern_text"
                                    value={rosterForm.data.pattern_text}
                                    onChange={(event) =>
                                        rosterForm.setData(
                                            'pattern_text',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={rosterForm.errors.pattern}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">
                                    Tanggal Mulai
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={rosterForm.data.start_date}
                                    onChange={(event) =>
                                        rosterForm.setData(
                                            'start_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={rosterForm.errors.start_date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">
                                    Tanggal Selesai
                                </Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={rosterForm.data.end_date}
                                    onChange={(event) =>
                                        rosterForm.setData(
                                            'end_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={rosterForm.errors.end_date}
                                />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                            <Button
                                type="button"
                                onClick={applyRoster}
                                disabled={rosterForm.processing}
                            >
                                <WandSparkles className="size-4" />
                                Terapkan Roster
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div>
                            <CardTitle>Schedule Bulanan</CardTitle>
                            <CardDescription>
                                Karyawan:{' '}
                                {employeeLookup.get(filterState.employee_id) ??
                                    '-'}{' '}
                                | Bulan: {filterState.month}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            onClick={saveSchedule}
                            disabled={scheduleRows.length === 0}
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
                                        <th className="px-2 py-2">Shift</th>
                                        <th className="px-2 py-2">Masuk</th>
                                        <th className="px-2 py-2">Pulang</th>
                                        <th className="px-2 py-2">Day Off</th>
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
                                                Tidak ada jadwal pada filter
                                                ini.
                                            </td>
                                        </tr>
                                    )}
                                    {scheduleRows.map((row, index) => (
                                        <tr key={row.date} className="border-b">
                                            <td className="px-2 py-2">
                                                {row.label}
                                            </td>
                                            <td className="px-2 py-2">
                                                <Select
                                                    value={row.shift_code}
                                                    onValueChange={(value) => {
                                                        const template =
                                                            shiftTemplates[
                                                                value
                                                            ];
                                                        const isOff =
                                                            value === 'OFF';
                                                        setScheduleRows(
                                                            (prev) =>
                                                                prev.map(
                                                                    (
                                                                        item,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  shift_code:
                                                                                      value,
                                                                                  is_day_off:
                                                                                      isOff ||
                                                                                      Boolean(
                                                                                          template?.is_day_off,
                                                                                      ),
                                                                                  start_time:
                                                                                      template?.start_time ??
                                                                                      (isOff
                                                                                          ? ''
                                                                                          : item.start_time),
                                                                                  end_time:
                                                                                      template?.end_time ??
                                                                                      (isOff
                                                                                          ? ''
                                                                                          : item.end_time),
                                                                              }
                                                                            : item,
                                                                ),
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[150px]">
                                                        <SelectValue placeholder="Shift" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {shiftOptions.map(
                                                            (shift) => (
                                                                <SelectItem
                                                                    key={shift}
                                                                    value={
                                                                        shift
                                                                    }
                                                                >
                                                                    {shift}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    type="time"
                                                    value={row.start_time}
                                                    onChange={(event) =>
                                                        setScheduleRows(
                                                            (prev) =>
                                                                prev.map(
                                                                    (
                                                                        item,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  start_time:
                                                                                      event
                                                                                          .target
                                                                                          .value,
                                                                              }
                                                                            : item,
                                                                ),
                                                        )
                                                    }
                                                    disabled={row.is_day_off}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    type="time"
                                                    value={row.end_time}
                                                    onChange={(event) =>
                                                        setScheduleRows(
                                                            (prev) =>
                                                                prev.map(
                                                                    (
                                                                        item,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  end_time:
                                                                                      event
                                                                                          .target
                                                                                          .value,
                                                                              }
                                                                            : item,
                                                                ),
                                                        )
                                                    }
                                                    disabled={row.is_day_off}
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center">
                                                    <Checkbox
                                                        checked={row.is_day_off}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const isDayOff =
                                                                checked ===
                                                                true;
                                                            setScheduleRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (
                                                                            item,
                                                                            itemIndex,
                                                                        ) =>
                                                                            itemIndex ===
                                                                            index
                                                                                ? {
                                                                                      ...item,
                                                                                      is_day_off:
                                                                                          isDayOff,
                                                                                      shift_code:
                                                                                          isDayOff
                                                                                              ? 'OFF'
                                                                                              : item.shift_code,
                                                                                      start_time:
                                                                                          isDayOff
                                                                                              ? ''
                                                                                              : item.start_time,
                                                                                      end_time:
                                                                                          isDayOff
                                                                                              ? ''
                                                                                              : item.end_time,
                                                                                  }
                                                                                : item,
                                                                    ),
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Input
                                                    value={row.notes}
                                                    onChange={(event) =>
                                                        setScheduleRows(
                                                            (prev) =>
                                                                prev.map(
                                                                    (
                                                                        item,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  notes: event
                                                                                      .target
                                                                                      .value,
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
        </AppLayout>
    );
}
