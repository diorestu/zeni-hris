<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreOvertimeRequest;
use App\Http\Requests\Hris\UpdateOvertimeRequest;
use App\Models\Employee;
use App\Models\OvertimeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class OvertimeController extends Controller
{
    /**
     * Display overtime management page.
     */
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'date' => ['nullable', 'date'],
        ]);

        $activeDate = Carbon::parse($validated['date'] ?? today())->toDateString();

        $filters = [
            'status' => $validated['status'] ?? '',
            'employee_id' => isset($validated['employee_id']) ? (string) $validated['employee_id'] : '',
            'date' => $activeDate,
        ];

        $overtimes = OvertimeRequest::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['employee_id'] !== '', fn ($query) => $query->where('employee_id', $filters['employee_id']))
            ->whereDate('work_date', $filters['date'])
            ->orderByDesc('work_date')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (OvertimeRequest $overtime) => [
                'id' => $overtime->id,
                'employee_id' => $overtime->employee_id,
                'employee_label' => $overtime->employee
                    ? $overtime->employee->employee_code.' - '.$overtime->employee->full_name
                    : '-',
                'work_date' => $overtime->work_date->format('Y-m-d'),
                'start_time' => $this->normalizeTime($overtime->start_time),
                'end_time' => $this->normalizeTime($overtime->end_time),
                'break_minutes' => $overtime->break_minutes,
                'total_hours' => $overtime->total_hours,
                'reason' => $overtime->reason,
                'status' => $overtime->status,
                'notes' => $overtime->notes,
            ]);

        $employees = Employee::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'employee_code', 'first_name', 'last_name']);

        return Inertia::render('hris/overtimes/index', [
            'overtimes' => $overtimes,
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ]),
            'filters' => $filters,
            'statusOptions' => ['pending', 'approved', 'rejected'],
            'stats' => [
                'pending' => OvertimeRequest::query()->where('status', 'pending')->count(),
                'approved' => OvertimeRequest::query()->where('status', 'approved')->count(),
            ],
        ]);
    }

    /**
     * Store overtime request.
     */
    public function store(StoreOvertimeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        OvertimeRequest::create([
            ...$validated,
            'break_minutes' => (int) ($validated['break_minutes'] ?? 0),
            'total_hours' => $this->calculateTotalHours(
                $validated['start_time'],
                $validated['end_time'],
                (int) ($validated['break_minutes'] ?? 0)
            ),
            'approved_at' => $validated['status'] === 'approved' ? now() : null,
            'approved_by' => $validated['status'] === 'approved' ? $request->user()?->id : null,
        ]);

        return back();
    }

    /**
     * Update overtime request.
     */
    public function update(UpdateOvertimeRequest $request, OvertimeRequest $overtime): RedirectResponse
    {
        $validated = $request->validated();

        $overtime->update([
            ...$validated,
            'break_minutes' => (int) ($validated['break_minutes'] ?? 0),
            'total_hours' => $this->calculateTotalHours(
                $validated['start_time'],
                $validated['end_time'],
                (int) ($validated['break_minutes'] ?? 0)
            ),
            'approved_at' => $validated['status'] === 'approved' ? ($overtime->approved_at ?? now()) : null,
            'approved_by' => $validated['status'] === 'approved' ? ($overtime->approved_by ?? $request->user()?->id) : null,
        ]);

        return back();
    }

    /**
     * Delete overtime request.
     */
    public function destroy(OvertimeRequest $overtime): RedirectResponse
    {
        $overtime->delete();

        return back();
    }

    /**
     * Export overtime requests to XLS-compatible file.
     */
    public function export(Request $request): StreamedResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'date' => ['nullable', 'date'],
        ]);

        $filters = [
            'status' => $validated['status'] ?? '',
            'employee_id' => isset($validated['employee_id']) ? (string) $validated['employee_id'] : '',
            'date' => Carbon::parse($validated['date'] ?? today())->toDateString(),
        ];

        $rows = OvertimeRequest::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['employee_id'] !== '', fn ($query) => $query->where('employee_id', $filters['employee_id']))
            ->whereDate('work_date', $filters['date'])
            ->orderByDesc('work_date')
            ->get();

        $fileName = 'overtimes_'.now()->format('Ymd_His').'.xls';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'wb');

            fputcsv($out, [
                'Tanggal',
                'Kode Pegawai',
                'Nama Pegawai',
                'Jam Mulai',
                'Jam Selesai',
                'Break (menit)',
                'Total Jam',
                'Status',
                'Alasan',
            ], "\t");

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->work_date?->format('Y-m-d'),
                    $row->employee?->employee_code,
                    $row->employee?->full_name,
                    $row->start_time,
                    $row->end_time,
                    $row->break_minutes,
                    $row->total_hours,
                    $row->status,
                    $row->reason,
                ], "\t");
            }

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

    /**
     * Calculate overtime total hours.
     */
    private function calculateTotalHours(string $startTime, string $endTime, int $breakMinutes): float
    {
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = Carbon::createFromFormat('H:i', $endTime);

        if ($end->lessThanOrEqualTo($start)) {
            throw ValidationException::withMessages([
                'end_time' => 'Jam selesai harus lebih besar dari jam mulai.',
            ]);
        }

        $minutes = $start->diffInMinutes($end) - $breakMinutes;

        if ($minutes < 0) {
            throw ValidationException::withMessages([
                'break_minutes' => 'Break melebihi durasi lembur.',
            ]);
        }

        return round($minutes / 60, 2);
    }

    /**
     * Normalize DB time string to HH:mm format.
     */
    private function normalizeTime(?string $time): ?string
    {
        if ($time === null || $time === '') {
            return null;
        }

        return Carbon::parse($time)->format('H:i');
    }
}
