<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StorePayrollKasbonRequest;
use App\Http\Requests\Hris\UpdatePayrollKasbonRequest;
use App\Models\EmployeeDeduction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class KasbonController extends Controller
{
    use InteractsWithMobileApiResponse;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $period = $validated['period'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m-d', $period.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $query = EmployeeDeduction::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->where('type', 'kasbon')
            ->whereBetween('deduction_date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('deduction_date')
            ->orderByDesc('id');

        $totalAmount = (clone $query)->sum('amount');

        $paginator = $query
            ->paginate((int) ($validated['per_page'] ?? 20))
            ->withQueryString();

        return $this->success([
            'period' => $period,
            'summary' => [
                'total_entries' => $paginator->total(),
                'total_amount' => (float) $totalAmount,
            ],
            'items' => collect($paginator->items())->map(fn (EmployeeDeduction $deduction) => $this->payload($deduction))->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StorePayrollKasbonRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $deduction = EmployeeDeduction::query()->create([
            'employee_id' => $validated['employee_id'],
            'type' => 'kasbon',
            'amount' => $validated['amount'],
            'deduction_date' => $validated['deduction_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $deduction->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($deduction), 'Kasbon berhasil ditambahkan.', 201);
    }

    public function update(UpdatePayrollKasbonRequest $request, EmployeeDeduction $employeeDeduction): JsonResponse
    {
        abort_if($employeeDeduction->type !== 'kasbon', 404);

        $validated = $request->validated();

        $employeeDeduction->update([
            'employee_id' => $validated['employee_id'],
            'type' => 'kasbon',
            'amount' => $validated['amount'],
            'deduction_date' => $validated['deduction_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $employeeDeduction->refresh()->load('employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($employeeDeduction), 'Kasbon berhasil diperbarui.');
    }

    public function destroy(EmployeeDeduction $employeeDeduction): JsonResponse
    {
        abort_if($employeeDeduction->type !== 'kasbon', 404);

        $employeeDeduction->delete();

        return $this->success(null, 'Kasbon berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(EmployeeDeduction $deduction): array
    {
        return [
            'id' => $deduction->id,
            'employee_id' => $deduction->employee_id,
            'employee_label' => $deduction->employee
                ? $deduction->employee->employee_code.' - '.$deduction->employee->full_name
                : '-',
            'type' => $deduction->type,
            'amount' => $deduction->amount,
            'deduction_date' => $deduction->deduction_date?->format('Y-m-d'),
            'notes' => $deduction->notes,
        ];
    }
}
