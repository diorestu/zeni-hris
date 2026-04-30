<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Api\Mobile\V1\Concerns\InteractsWithSelfService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\GeneratePayrollRequest;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\PayrollRun;
use App\Models\User;
use App\Support\PayrollTax;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    use InteractsWithMobileApiResponse, InteractsWithSelfService;

    public function preview(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $validated['period'] ?? now()->format('Y-m');

        $run = PayrollRun::query()
            ->with('items.employee:id,employee_code,first_name,last_name')
            ->where('period', $period)
            ->first();

        return $this->success($this->payload($period, $run, $user));
    }

    public function generate(GeneratePayrollRequest $request): JsonResponse
    {
        $ownerId = $request->user()->accountOwnerId();
        $period = $request->validated('period');
        $start = Carbon::createFromFormat('Y-m-d', $period.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $employees = Employee::query()
            ->where('is_active', true)
            ->whereIn('employment_status', ['active', 'probation', 'on_leave'])
            ->with([
                'allowances' => function ($query) use ($start, $end): void {
                    $query
                        ->where('is_active', true)
                        ->where(function ($builder) use ($end): void {
                            $builder->whereNull('effective_start_date')
                                ->orWhere('effective_start_date', '<=', $end->toDateString());
                        })
                        ->where(function ($builder) use ($start): void {
                            $builder->whereNull('effective_end_date')
                                ->orWhere('effective_end_date', '>=', $start->toDateString());
                        });
                },
                'deductions' => fn ($query) => $query->whereBetween('deduction_date', [
                    $start->toDateString(),
                    $end->toDateString(),
                ]),
            ])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $run = DB::transaction(function () use ($employees, $ownerId, $period, $start, $end, $request): PayrollRun {
            $run = PayrollRun::query()->updateOrCreate(
                [
                    'user_id' => $ownerId,
                    'period' => $period,
                ],
                [
                    'period_start' => $start->toDateString(),
                    'period_end' => $end->toDateString(),
                    'generated_at' => now(),
                    'generated_by' => $request->user()?->id,
                    'is_saved' => false,
                    'saved_at' => null,
                    'saved_by' => null,
                ]
            );

            $items = $employees->map(function (Employee $employee) use ($run, $start, $end): array {
                $baseSalary = (float) ($employee->base_salary ?? 0);

                $allowanceGrouped = $employee->allowances
                    ->groupBy('name')
                    ->map(fn ($rows) => round((float) $rows->sum('amount'), 2))
                    ->sortKeys();

                $allowancesTotal = round((float) $allowanceGrouped->sum(), 2);

                $pph21Method = (string) ($employee->pph21_method ?? 'gross');
                $pph21Rate = round((float) ($employee->pph21_rate ?? 0), 2);
                $pph21RateFraction = $pph21Rate / 100;

                $workingDays = 0;

                if ($pph21Method === 'ter_harian') {
                    $workingDays = EmployeeAttendance::query()
                        ->where('employee_id', $employee->id)
                        ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()])
                        ->whereIn('status', ['present', 'late'])
                        ->count();
                }

                $dailyBase = $workingDays > 0
                    ? round($baseSalary / max($workingDays, 1), 2)
                    : 0;

                $dailyAllowance = $workingDays > 0
                    ? round($allowancesTotal / max($workingDays, 1), 2)
                    : 0;

                $taxableGross = $pph21Method === 'ter_harian'
                    ? round(($dailyBase + $dailyAllowance) * $workingDays, 2)
                    : round($baseSalary + $allowancesTotal, 2);

                $pph21Allowance = 0;
                $pph21Deduction = 0;
                $pph21CompanyBorne = 0;

                if ($pph21Method === 'gross') {
                    $pph21Deduction = PayrollTax::floorRupiah($taxableGross * $pph21RateFraction);
                }

                if ($pph21Method === 'net') {
                    $pph21CompanyBorne = PayrollTax::floorRupiah($taxableGross * $pph21RateFraction);
                }

                if ($pph21Method === 'gross_up') {
                    $pph21Allowance = PayrollTax::grossUpAllowance($taxableGross, $pph21RateFraction);
                    $pph21Deduction = $pph21Allowance;
                }

                if ($pph21Method === 'ter_harian') {
                    $pph21Deduction = PayrollTax::floorRupiah($taxableGross * $pph21RateFraction);
                }

                $kasbonDeduction = round((float) $employee->deductions
                    ->where('type', 'kasbon')
                    ->sum('amount'), 2);

                $dendaDeduction = round((float) $employee->deductions
                    ->where('type', 'denda')
                    ->sum('amount'), 2);

                $deductionsTotal = round($kasbonDeduction + $dendaDeduction + $pph21Deduction, 2);
                $netSalary = round(max(($baseSalary + $allowancesTotal + $pph21Allowance) - ($kasbonDeduction + $dendaDeduction + $pph21Deduction), 0), 2);

                return [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                    'base_salary' => $baseSalary,
                    'allowances_total' => $allowancesTotal,
                    'pph21_method' => $pph21Method,
                    'pph21_rate' => $pph21Rate,
                    'pph21_allowance' => $pph21Allowance,
                    'pph21_deduction' => $pph21Deduction,
                    'pph21_company_borne' => $pph21CompanyBorne,
                    'kasbon_deduction' => $kasbonDeduction,
                    'denda_deduction' => $dendaDeduction,
                    'deductions_total' => $deductionsTotal,
                    'net_salary' => $netSalary,
                    'allowance_breakdown' => $allowanceGrouped->toArray(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->values();

            $run->items()->delete();

            if ($items->isNotEmpty()) {
                $run->items()->createMany($items->toArray());
            }

            $run->update([
                'employees_count' => $items->count(),
                'total_base_salary' => round((float) $items->sum('base_salary'), 2),
                'total_allowances' => round((float) $items->sum('allowances_total'), 2),
                'total_deductions' => round((float) $items->sum('deductions_total'), 2),
                'total_net_salary' => round((float) $items->sum('net_salary'), 2),
                'generated_at' => now(),
                'generated_by' => $request->user()?->id,
                'is_saved' => false,
                'saved_at' => null,
                'saved_by' => null,
            ]);

            return $run;
        });

        $run->load('items.employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($period, $run, $request->user()), 'Payroll berhasil di-generate.');
    }

    public function save(PayrollRun $payrollRun, Request $request): JsonResponse
    {
        $payrollRun->update([
            'is_saved' => true,
            'saved_at' => now(),
            'saved_by' => $request->user()?->id,
        ]);

        $payrollRun->load('items.employee:id,employee_code,first_name,last_name');

        return $this->success($this->payload($payrollRun->period, $payrollRun, $request->user()), 'Payroll berhasil disimpan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $period, ?PayrollRun $run, ?User $user = null): array
    {
        $items = $run?->items ?? collect();

        if ($run && $user && $this->isSelfServiceUser($user)) {
            $employee = $this->resolveRequiredSelfServiceEmployee($user);
            $items = $items->where('employee_id', $employee->id)->values();
        }

        return [
            'period' => $period,
            'run' => $run ? [
                'id' => $run->id,
                'period' => $run->period,
                'period_start' => $run->period_start?->format('Y-m-d'),
                'period_end' => $run->period_end?->format('Y-m-d'),
                'generated_at' => $run->generated_at?->toDateTimeString(),
                'generated_by' => $run->generated_by,
                'is_saved' => $run->is_saved,
                'saved_at' => $run->saved_at?->toDateTimeString(),
                'saved_by' => $run->saved_by,
                'employees_count' => $run->employees_count,
                'total_base_salary' => $run->total_base_salary,
                'total_allowances' => $run->total_allowances,
                'total_deductions' => $run->total_deductions,
                'total_net_salary' => $run->total_net_salary,
            ] : null,
            'items' => $run
                ? $items->map(fn ($item) => [
                    'id' => $item->id,
                    'employee_id' => $item->employee_id,
                    'employee_label' => $item->employee
                        ? $item->employee->employee_code.' - '.$item->employee->full_name
                        : '-',
                    'base_salary' => $item->base_salary,
                    'allowances_total' => $item->allowances_total,
                    'pph21_method' => $item->pph21_method,
                    'pph21_rate' => $item->pph21_rate,
                    'pph21_allowance' => $item->pph21_allowance,
                    'pph21_deduction' => $item->pph21_deduction,
                    'pph21_company_borne' => $item->pph21_company_borne,
                    'kasbon_deduction' => $item->kasbon_deduction,
                    'denda_deduction' => $item->denda_deduction,
                    'deductions_total' => $item->deductions_total,
                    'net_salary' => $item->net_salary,
                    'allowance_breakdown' => $item->allowance_breakdown ?? [],
                ])->values()
                : [],
        ];
    }
}
