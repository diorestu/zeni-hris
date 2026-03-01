<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreAttendanceRequest;
use App\Http\Requests\Hris\UpdateAttendanceRequest;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Display attendance page and monthly schedule panel.
     */
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'sort_by' => ['nullable', 'in:employee,check_in_at,check_out_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $employees = Employee::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'employee_code', 'first_name', 'last_name']);

        $activeDate = $validated['date'] ?? today()->toDateString();

        $filters = [
            'date' => $activeDate,
            'status' => $validated['status'] ?? '',
            'employee_id' => isset($validated['employee_id']) ? (string) $validated['employee_id'] : '',
            'sort_by' => $validated['sort_by'] ?? 'employee',
            'sort_dir' => $validated['sort_dir'] ?? 'asc',
        ];

        $attendancesQuery = EmployeeAttendance::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->whereDate('attendance_date', $filters['date'])
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['employee_id'] !== '', fn ($query) => $query->where('employee_id', $filters['employee_id']));

        if ($filters['sort_by'] === 'check_in_at') {
            $attendancesQuery
                ->orderByRaw('check_in_at IS NULL')
                ->orderBy('check_in_at', $filters['sort_dir']);
        } elseif ($filters['sort_by'] === 'check_out_at') {
            $attendancesQuery
                ->orderByRaw('check_out_at IS NULL')
                ->orderBy('check_out_at', $filters['sort_dir']);
        } else {
            $attendancesQuery->orderBy('employee_id', $filters['sort_dir']);
        }

        $attendancesPaginator = $attendancesQuery
            ->paginate(12)
            ->withQueryString();

        $employeeIds = collect($attendancesPaginator->items())
            ->pluck('employee_id')
            ->unique()
            ->values();

        $shiftByEmployee = $employeeIds->isEmpty()
            ? collect()
            : EmployeeSchedule::query()
                ->whereDate('work_date', $filters['date'])
                ->whereIn('employee_id', $employeeIds)
                ->pluck('shift_code', 'employee_id');

        $attendances = $attendancesPaginator->through(fn (EmployeeAttendance $attendance) => [
                'id' => $attendance->id,
                'employee_id' => $attendance->employee_id,
                'employee_label' => $attendance->employee
                    ? $attendance->employee->employee_code.' - '.$attendance->employee->full_name
                    : '-',
                'attendance_date' => $attendance->attendance_date->format('Y-m-d'),
                'shift_name' => (string) ($shiftByEmployee->get($attendance->employee_id) ?? 'OFF'),
                'status' => $attendance->status,
                'check_in_at' => $attendance->check_in_at?->format('Y-m-d\\TH:i'),
                'check_out_at' => $attendance->check_out_at?->format('Y-m-d\\TH:i'),
                'check_in_time' => $attendance->check_in_at?->format('H:i'),
                'check_out_time' => $attendance->check_out_at?->format('H:i'),
                'notes' => $attendance->notes,
            ]);

        $todaySummaryRows = EmployeeAttendance::query()
            ->selectRaw('status, COUNT(*) as total')
            ->whereDate('attendance_date', today())
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('hris/attendances/index', [
            'attendances' => $attendances,
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ]),
            'filters' => $filters,
            'todaySummary' => [
                'present' => (int) ($todaySummaryRows['present'] ?? 0),
                'late' => (int) ($todaySummaryRows['late'] ?? 0),
                'on_leave' => (int) ($todaySummaryRows['on_leave'] ?? 0),
                'absent' => (int) ($todaySummaryRows['absent'] ?? 0),
            ],
            'statusOptions' => ['present', 'late', 'on_leave', 'absent'],
        ]);
    }

    /**
     * Store new attendance record.
     */
    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        EmployeeAttendance::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'attendance_date' => $validated['attendance_date'],
            ],
            [
                'status' => $validated['status'],
                'check_in_at' => $validated['check_in_at'] ?? null,
                'check_out_at' => $validated['check_out_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return back();
    }

    /**
     * Update attendance record.
     */
    public function update(UpdateAttendanceRequest $request, EmployeeAttendance $employeeAttendance): RedirectResponse
    {
        $employeeAttendance->update($request->validated());

        return back();
    }

    /**
     * Delete attendance record.
     */
    public function destroy(EmployeeAttendance $employeeAttendance): RedirectResponse
    {
        $employeeAttendance->delete();

        return back();
    }

    /**
     * Export attendance records to XLS-compatible file.
     */
    public function export(Request $request): StreamedResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'sort_by' => ['nullable', 'in:employee,check_in_at,check_out_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $filters = [
            'date' => $validated['date'] ?? today()->toDateString(),
            'status' => $validated['status'] ?? '',
            'employee_id' => isset($validated['employee_id']) ? (string) $validated['employee_id'] : '',
            'sort_by' => $validated['sort_by'] ?? 'employee',
            'sort_dir' => $validated['sort_dir'] ?? 'asc',
        ];

        $query = EmployeeAttendance::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->whereDate('attendance_date', $filters['date'])
            ->when($filters['status'] !== '', fn ($builder) => $builder->where('status', $filters['status']))
            ->when($filters['employee_id'] !== '', fn ($builder) => $builder->where('employee_id', $filters['employee_id']));

        if ($filters['sort_by'] === 'check_in_at') {
            $query->orderByRaw('check_in_at IS NULL')->orderBy('check_in_at', $filters['sort_dir']);
        } elseif ($filters['sort_by'] === 'check_out_at') {
            $query->orderByRaw('check_out_at IS NULL')->orderBy('check_out_at', $filters['sort_dir']);
        } else {
            $query->orderBy('employee_id', $filters['sort_dir']);
        }

        $rows = $query->get();
        $fileName = 'attendances_'.now()->format('Ymd_His').'.xls';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'wb');

            fputcsv($out, [
                'Tanggal',
                'Kode Pegawai',
                'Nama Pegawai',
                'Status',
                'Check In',
                'Check Out',
                'Catatan',
            ], "\t");

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->attendance_date?->format('Y-m-d'),
                    $row->employee?->employee_code,
                    $row->employee?->full_name,
                    $row->status,
                    $row->check_in_at?->format('H:i'),
                    $row->check_out_at?->format('H:i'),
                    $row->notes,
                ], "\t");
            }

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

}
