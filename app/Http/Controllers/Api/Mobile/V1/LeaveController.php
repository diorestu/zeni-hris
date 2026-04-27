<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Api\Mobile\V1\Concerns\InteractsWithSelfService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreLeaveRequest;
use App\Http\Requests\Hris\UpdateLeaveRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class LeaveController extends Controller
{
    use InteractsWithMobileApiResponse, InteractsWithSelfService;

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'cancelled'])],
            'employee_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'date' => ['nullable', 'date'],
            'scope' => ['nullable', Rule::in(['active', 'all'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $activeDate = Carbon::parse($validated['date'] ?? today())->toDateString();

        $query = LeaveRequest::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->when(($validated['status'] ?? '') !== '', fn ($builder) => $builder->where('status', $validated['status']))
            ->when(isset($validated['employee_id']), fn ($builder) => $builder->where('employee_id', $validated['employee_id']))
            ->orderByDesc('start_date')
            ->orderByDesc('id');

        if (($validated['scope'] ?? 'active') !== 'all') {
            $query
                ->whereDate('start_date', '<=', $activeDate)
                ->whereDate('end_date', '>=', $activeDate);
        }

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $query->where('employee_id', $employee->id);
        }

        $paginator = $query
            ->paginate((int) ($validated['per_page'] ?? 20))
            ->withQueryString();

        return $this->success([
            'items' => collect($paginator->items())->map(fn (LeaveRequest $leave) => $this->payload($leave))->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'pending' => LeaveRequest::query()->where('status', 'pending')->count(),
                'approved' => LeaveRequest::query()->where('status', 'approved')->count(),
            ],
        ]);
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        $validated = $request->validated();
        /** @var User $user */
        $user = $request->user();

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = 'pending';
            $validated['rejection_reason'] = null;
        }

        [$approvedAt, $approvedBy] = $this->resolveApprovalState($validated['status'], $request->user()?->id);

        $leave = LeaveRequest::query()->create([
            ...$validated,
            'total_days' => $this->calculateTotalDays($validated['start_date'], $validated['end_date']),
            'approved_at' => $approvedAt,
            'approved_by' => $approvedBy,
        ]);

        $leave->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($leave), 'Pengajuan cuti berhasil dibuat.', 201);
    }

    public function update(UpdateLeaveRequest $request, LeaveRequest $leave): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $leave->employee_id);

        $validated = $request->validated();

        if ($this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $validated['employee_id'] = $employee->id;
            $validated['status'] = 'pending';
            $validated['rejection_reason'] = null;
        }

        [$approvedAt, $approvedBy] = $this->resolveApprovalState(
            $validated['status'],
            $request->user()?->id,
            $leave->approved_at?->toDateTimeString(),
            $leave->approved_by
        );

        $leave->update([
            ...$validated,
            'total_days' => $this->calculateTotalDays($validated['start_date'], $validated['end_date']),
            'approved_at' => $approvedAt,
            'approved_by' => $approvedBy,
        ]);

        $leave->refresh()->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($leave), 'Pengajuan cuti berhasil diperbarui.');
    }

    public function destroy(Request $request, LeaveRequest $leave): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->guardSelfServiceRecordOwnership($user, (int) $leave->employee_id);

        $leave->delete();

        return $this->success(null, 'Pengajuan cuti berhasil dihapus.');
    }

    private function calculateTotalDays(string $startDate, string $endDate): float
    {
        return (float) Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
    }

    /**
     * @return array{0: null|string, 1: null|int}
     */
    private function resolveApprovalState(string $status, null|int|string $userId, ?string $currentApprovedAt = null, ?int $currentApprovedBy = null): array
    {
        if ($status === 'approved') {
            return [$currentApprovedAt ?? now()->toDateTimeString(), $currentApprovedBy ?? (int) $userId];
        }

        return [null, null];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(LeaveRequest $leave): array
    {
        return [
            'id' => $leave->id,
            'employee_id' => $leave->employee_id,
            'employee_label' => $leave->employee
                ? $leave->employee->employee_code.' - '.$leave->employee->full_name
                : '-',
            'leave_type' => $leave->leave_type,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'total_days' => $leave->total_days,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'rejection_reason' => $leave->rejection_reason,
            'approved_by' => $leave->approved_by,
            'approved_at' => $leave->approved_at?->toDateTimeString(),
        ];
    }
}
