<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Api\Mobile\V1\Concerns\InteractsWithSelfService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreAttendanceRequest;
use App\Http\Requests\Hris\UpdateAttendanceRequest;
use App\Models\EmployeeAttendance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    use InteractsWithMobileApiResponse, InteractsWithSelfService;

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ownerId = $request->user()->accountOwnerId();
        $timezone = $this->deviceTimezone($request);

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'period' => ['nullable', 'date_format:Y-m'],
            'status' => ['nullable', Rule::in(['present', 'late', 'on_leave', 'absent'])],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'sort_by' => ['nullable', 'in:employee,check_in_at,check_out_at,attendance_date'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = EmployeeAttendance::query()
            ->with(['employee:id,employee_code,first_name,last_name', 'shift:id,code,name,start_time,end_time,is_day_off'])
            ->when(($validated['status'] ?? '') !== '', fn ($builder) => $builder->where('status', $validated['status']))
            ->when(isset($validated['employee_id']), fn ($builder) => $builder->where('employee_id', $validated['employee_id']));

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $query->where('employee_id', $employee->id);
        }

        if (isset($validated['date'])) {
            $query->whereDate('attendance_date', $validated['date']);
        } elseif (isset($validated['period'])) {
            $start = Carbon::createFromFormat('Y-m', $validated['period'])->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $query->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()]);
        } else {
            $query->whereDate('attendance_date', Carbon::today($timezone)->toDateString());
        }

        $summary = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $sortBy = $validated['sort_by'] ?? 'attendance_date';
        $sortDir = $validated['sort_dir'] ?? 'desc';

        if ($sortBy === 'check_in_at') {
            $query->orderByRaw('check_in_at IS NULL')->orderBy('check_in_at', $sortDir);
        } elseif ($sortBy === 'check_out_at') {
            $query->orderByRaw('check_out_at IS NULL')->orderBy('check_out_at', $sortDir);
        } elseif ($sortBy === 'employee') {
            $query->orderBy('employee_id', $sortDir);
        } else {
            $query->orderBy('attendance_date', $sortDir)->orderByDesc('id');
        }

        $paginator = $query
            ->paginate((int) ($validated['per_page'] ?? 20))
            ->withQueryString();

        return $this->success([
            'summary' => [
                'present' => (int) ($summary['present'] ?? 0),
                'late' => (int) ($summary['late'] ?? 0),
                'on_leave' => (int) ($summary['on_leave'] ?? 0),
                'absent' => (int) ($summary['absent'] ?? 0),
            ],
            'items' => collect($paginator->items())->map(fn (EmployeeAttendance $attendance) => $this->payload($attendance))->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $validated = $request->validated();
        /** @var User $user */
        $user = $request->user();
        $timezone = $this->deviceTimezone($request);

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = 'present';
        }

        $openAttendance = EmployeeAttendance::query()
            ->where('employee_id', $validated['employee_id'])
            ->whereNull('check_out_at')
            ->whereDate('attendance_date', '>=', Carbon::today($timezone)->subDays(3)->toDateString())
            ->first();

        if ($openAttendance) {
            return $this->error('Masih ada absensi yang belum clock out.');
        }

        $existingAttendance = EmployeeAttendance::query()
            ->where('employee_id', $validated['employee_id'])
            ->whereDate('attendance_date', $validated['attendance_date'])
            ->first();

        if ($existingAttendance) {
            return $this->error('Absensi untuk tanggal ini sudah ada.');
        }

        $attendance = EmployeeAttendance::query()->create([
            'employee_id' => $validated['employee_id'],
            'shift_id' => $validated['shift_id'],
            'attendance_date' => $validated['attendance_date'],
            'status' => $validated['status'],
            'check_in_at' => $validated['check_in_at'] ?? null,
            'check_in_latitude' => $validated['check_in_latitude'] ?? null,
            'check_in_longitude' => $validated['check_in_longitude'] ?? null,
            'check_out_at' => $validated['check_out_at'] ?? null,
            'check_out_latitude' => $validated['check_out_latitude'] ?? null,
            'check_out_longitude' => $validated['check_out_longitude'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $attendance->load(['employee:id,employee_code,first_name,last_name', 'shift:id,code,name,start_time,end_time,is_day_off']);

        return $this->success($this->payload($attendance), 'Absensi berhasil disimpan.', 201);
    }

    public function update(UpdateAttendanceRequest $request, EmployeeAttendance $employeeAttendance): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $employeeAttendance->employee_id);

        $validated = $request->validated();
        $timezone = $this->deviceTimezone($request);

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = $employeeAttendance->status ?: 'present';
        }

        if (
            $employeeAttendance->check_out_at !== null
            && ! $request->boolean('force', false)
        ) {
            return $this->error('Absensi ini sudah clock out.');
        }

        if ($employeeAttendance->attendance_date->lt(Carbon::today($timezone)->subDays(3))) {
            return $this->error('Clock out hanya bisa dilakukan maksimal 3 hari dari tanggal absensi.');
        }

        $employeeAttendance->update($validated);
        $employeeAttendance->refresh()->load(['employee:id,employee_code,first_name,last_name', 'shift:id,code,name,start_time,end_time,is_day_off']);

        return $this->success($this->payload($employeeAttendance), 'Absensi berhasil diperbarui.');
    }

    public function destroy(Request $request, EmployeeAttendance $employeeAttendance): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $employeeAttendance->employee_id);

        $employeeAttendance->delete();

        return $this->success(null, 'Absensi berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(EmployeeAttendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'employee_id' => $attendance->employee_id,
            'employee_label' => $attendance->employee
                ? $attendance->employee->employee_code.' - '.$attendance->employee->full_name
                : '-',
            'attendance_date' => $attendance->attendance_date?->format('Y-m-d'),
            'status' => $attendance->status,
            'shift' => $attendance->shift ? [
                'id' => $attendance->shift->id,
                'code' => $attendance->shift->code,
                'name' => $attendance->shift->name,
                'start_time' => $attendance->shift->start_time,
                'end_time' => $attendance->shift->end_time,
                'is_day_off' => $attendance->shift->is_day_off,
            ] : null,
            'check_in_at' => $attendance->check_in_at?->toIso8601String(),
            'check_in_latitude' => $attendance->check_in_latitude,
            'check_in_longitude' => $attendance->check_in_longitude,
            'check_out_at' => $attendance->check_out_at?->toIso8601String(),
            'check_out_latitude' => $attendance->check_out_latitude,
            'check_out_longitude' => $attendance->check_out_longitude,
            'notes' => $attendance->notes,
        ];
    }

    private function deviceTimezone(Request $request): string
    {
        $timezone = (string) $request->header('X-Timezone', config('app.timezone'));

        return in_array($timezone, timezone_identifiers_list(), true)
            ? $timezone
            : config('app.timezone');
    }
}
