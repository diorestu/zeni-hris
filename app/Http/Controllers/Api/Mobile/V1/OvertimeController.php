<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Api\Mobile\V1\Concerns\InteractsWithSelfService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreOvertimeRequest;
use App\Http\Requests\Hris\UpdateOvertimeRequest;
use App\Models\OvertimeRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OvertimeController extends Controller
{
    use InteractsWithMobileApiResponse, InteractsWithSelfService;

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'date' => ['nullable', 'date'],
            'scope' => ['nullable', Rule::in(['day', 'all'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $activeDate = Carbon::parse($validated['date'] ?? today())->toDateString();

        $query = OvertimeRequest::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->when(($validated['status'] ?? '') !== '', fn ($builder) => $builder->where('status', $validated['status']))
            ->when(isset($validated['employee_id']), fn ($builder) => $builder->where('employee_id', $validated['employee_id']))
            ->orderByDesc('work_date')
            ->orderByDesc('id');

        if (($validated['scope'] ?? 'day') !== 'all') {
            $query->whereDate('work_date', $activeDate);
        }

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $query->where('employee_id', $employee->id);
        }

        $paginator = $query
            ->paginate((int) ($validated['per_page'] ?? 20))
            ->withQueryString();

        return $this->success([
            'items' => collect($paginator->items())->map(fn (OvertimeRequest $overtime) => $this->payload($overtime))->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'pending' => OvertimeRequest::query()->where('status', 'pending')->count(),
                'approved' => OvertimeRequest::query()->where('status', 'approved')->count(),
            ],
        ]);
    }

    public function store(StoreOvertimeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        /** @var User $user */
        $user = $request->user();

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = 'pending';
            $validated['notes'] = null;
        }

        $overtime = OvertimeRequest::query()->create([
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

        $overtime->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($overtime), 'Pengajuan lembur berhasil dibuat.', 201);
    }

    public function update(UpdateOvertimeRequest $request, OvertimeRequest $overtime): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $overtime->employee_id);

        $validated = $request->validated();

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = 'pending';
            $validated['notes'] = null;
        }

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

        $overtime->refresh()->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($overtime), 'Pengajuan lembur berhasil diperbarui.');
    }

    public function destroy(Request $request, OvertimeRequest $overtime): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $overtime->employee_id);

        $overtime->delete();

        return $this->success(null, 'Pengajuan lembur berhasil dihapus.');
    }

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

    private function normalizeTime(?string $time): ?string
    {
        if ($time === null || $time === '') {
            return null;
        }

        return Carbon::parse($time)->format('H:i');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(OvertimeRequest $overtime): array
    {
        return [
            'id' => $overtime->id,
            'employee_id' => $overtime->employee_id,
            'employee_label' => $overtime->employee
                ? $overtime->employee->employee_code.' - '.$overtime->employee->full_name
                : '-',
            'work_date' => $overtime->work_date?->format('Y-m-d'),
            'start_time' => $this->normalizeTime($overtime->start_time),
            'end_time' => $this->normalizeTime($overtime->end_time),
            'break_minutes' => $overtime->break_minutes,
            'total_hours' => $overtime->total_hours,
            'reason' => $overtime->reason,
            'status' => $overtime->status,
            'notes' => $overtime->notes,
            'approved_by' => $overtime->approved_by,
            'approved_at' => $overtime->approved_at?->toDateTimeString(),
        ];
    }
}
