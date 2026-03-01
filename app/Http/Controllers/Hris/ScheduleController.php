<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreAttendanceScheduleRequest;
use App\Http\Requests\Hris\StoreScheduleRosterRequest;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * Display schedule page with monthly rows.
     */
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
        ]);

        $employees = Employee::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'employee_code', 'first_name', 'last_name']);

        $filters = [
            'month' => $validated['month'] ?? now()->format('Y-m'),
            'employee_id' => isset($validated['employee_id'])
                ? (string) $validated['employee_id']
                : (string) ($employees->first()?->id ?? ''),
        ];

        return Inertia::render('hris/schedules/index', [
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ]),
            'filters' => $filters,
            'shiftOptions' => ['OFF', 'SHIFT_A', 'SHIFT_B', 'SHIFT_C', 'WFH'],
            'scheduleDays' => $this->buildScheduleDays($filters['month'], $filters['employee_id']),
            'shiftTemplates' => $this->shiftTemplates(),
        ]);
    }

    /**
     * Upsert schedule rows for one employee in one month.
     */
    public function store(StoreAttendanceScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $ownerId = $request->user()->accountOwnerId();

        $monthStart = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $rows = collect($validated['entries'])
            ->filter(function (array $entry) use ($monthStart, $monthEnd): bool {
                $entryDate = Carbon::parse($entry['date']);

                return $entryDate->betweenIncluded($monthStart, $monthEnd);
            })
            ->map(function (array $entry) use ($validated, $ownerId): array {
                $isDayOff = (bool) ($entry['is_day_off'] ?? false);

                if (($entry['shift_code'] ?? '') === 'OFF') {
                    $isDayOff = true;
                }

                return [
                    'user_id' => $ownerId,
                    'employee_id' => $validated['employee_id'],
                    'work_date' => $entry['date'],
                    'shift_code' => $entry['shift_code'],
                    'start_time' => $entry['start_time'] ?? null,
                    'end_time' => $entry['end_time'] ?? null,
                    'is_day_off' => $isDayOff,
                    'notes' => $entry['notes'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->values()
            ->all();

        if (! empty($rows)) {
            EmployeeSchedule::query()->upsert(
                $rows,
                ['employee_id', 'work_date'],
                ['shift_code', 'start_time', 'end_time', 'is_day_off', 'notes', 'updated_at']
            );
        }

        return back();
    }

    /**
     * Generate roster shifts for a date range.
     */
    public function roster(StoreScheduleRosterRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $ownerId = $request->user()->accountOwnerId();
        $templates = $this->shiftTemplates();
        $pattern = array_values($validated['pattern']);

        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->startOfDay();
        $cursor = $start->copy();

        $rows = [];
        $index = 0;

        while ($cursor->lte($end)) {
            $shiftCode = $pattern[$index % count($pattern)];
            $template = $templates[$shiftCode] ?? $templates['OFF'];

            $rows[] = [
                'user_id' => $ownerId,
                'employee_id' => $validated['employee_id'],
                'work_date' => $cursor->toDateString(),
                'shift_code' => $shiftCode,
                'start_time' => $template['start_time'],
                'end_time' => $template['end_time'],
                'is_day_off' => $template['is_day_off'],
                'notes' => 'Auto roster',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $index++;
            $cursor->addDay();
        }

        EmployeeSchedule::query()->upsert(
            $rows,
            ['employee_id', 'work_date'],
            ['shift_code', 'start_time', 'end_time', 'is_day_off', 'notes', 'updated_at']
        );

        return back();
    }

    /**
     * Build month-day rows with existing schedule values.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildScheduleDays(string $month, string $employeeId): array
    {
        if ($month === '' || $employeeId === '') {
            return [];
        }

        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $existing = EmployeeSchedule::query()
            ->where('employee_id', $employeeId)
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(fn (EmployeeSchedule $schedule) => $schedule->work_date->toDateString());

        $days = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $date = $cursor->toDateString();
            $saved = $existing->get($date);

            $days[] = [
                'date' => $date,
                'label' => $cursor->translatedFormat('d M (D)'),
                'shift_code' => $saved?->shift_code ?? 'OFF',
                'start_time' => $this->normalizeTime($saved?->start_time),
                'end_time' => $this->normalizeTime($saved?->end_time),
                'is_day_off' => $saved?->is_day_off ?? true,
                'notes' => $saved?->notes ?? null,
            ];

            $cursor->addDay();
        }

        return $days;
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

    /**
     * Built-in shift templates used by roster generation.
     *
     * @return array<string, array{start_time: null|string, end_time: null|string, is_day_off: bool}>
     */
    private function shiftTemplates(): array
    {
        return [
            'OFF' => [
                'start_time' => null,
                'end_time' => null,
                'is_day_off' => true,
            ],
            'SHIFT_A' => [
                'start_time' => '08:00',
                'end_time' => '16:00',
                'is_day_off' => false,
            ],
            'SHIFT_B' => [
                'start_time' => '16:00',
                'end_time' => '23:00',
                'is_day_off' => false,
            ],
            'SHIFT_C' => [
                'start_time' => '00:00',
                'end_time' => '08:00',
                'is_day_off' => false,
            ],
            'WFH' => [
                'start_time' => '09:00',
                'end_time' => '17:00',
                'is_day_off' => false,
            ],
        ];
    }
}
