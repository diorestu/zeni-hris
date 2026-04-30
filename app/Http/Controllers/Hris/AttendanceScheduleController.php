<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreAttendanceScheduleRequest;
use App\Models\EmployeeSchedule;
use App\Models\WorkShift;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class AttendanceScheduleController extends Controller
{
    /**
     * Upsert monthly schedule rows for one employee.
     */
    public function store(StoreAttendanceScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $ownerId = $request->user()->accountOwnerId();
        $shiftTemplates = WorkShift::query()
            ->where('user_id', $ownerId)
            ->get()
            ->mapWithKeys(fn (WorkShift $shift) => [
                $shift->code => [
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'is_day_off' => $shift->is_day_off,
                ],
            ])
            ->all();

        $monthStart = Carbon::createFromFormat('Y-m-d', $validated['month'].'-01')->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $rows = collect($validated['entries'])
            ->filter(function (array $entry) use ($monthStart, $monthEnd): bool {
                $entryDate = Carbon::parse($entry['date']);

                return $entryDate->betweenIncluded($monthStart, $monthEnd);
            })
            ->map(function (array $entry) use ($validated, $ownerId, $shiftTemplates): array {
                $template = $shiftTemplates[$entry['shift_code']] ?? [
                    'start_time' => null,
                    'end_time' => null,
                    'is_day_off' => true,
                ];

                return [
                    'user_id' => $ownerId,
                    'employee_id' => $validated['employee_id'],
                    'work_date' => $entry['date'],
                    'shift_code' => $entry['shift_code'],
                    'start_time' => $template['start_time'],
                    'end_time' => $template['end_time'],
                    'is_day_off' => $template['is_day_off'],
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
}
