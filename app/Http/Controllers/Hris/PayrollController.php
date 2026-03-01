<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\GeneratePayrollRequest;
use App\Models\Employee;
use App\Models\PayrollRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    /**
     * Display payroll generation and preview page.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $validated['period'] ?? now()->format('Y-m');

        $run = PayrollRun::query()
            ->with([
                'items.employee:id,employee_code,first_name,last_name',
            ])
            ->where('period', $period)
            ->first();

        return Inertia::render('hris/payrolls/index', [
            'period' => $period,
            'run' => $run ? [
                'id' => $run->id,
                'period' => $run->period,
                'period_start' => $run->period_start?->format('Y-m-d'),
                'period_end' => $run->period_end?->format('Y-m-d'),
                'generated_at' => $run->generated_at?->toDateTimeString(),
                'is_saved' => $run->is_saved,
                'saved_at' => $run->saved_at?->toDateTimeString(),
                'employees_count' => $run->employees_count,
                'total_base_salary' => $run->total_base_salary,
                'total_allowances' => $run->total_allowances,
                'total_deductions' => $run->total_deductions,
                'total_net_salary' => $run->total_net_salary,
            ] : null,
            'items' => $run
                ? $run->items->map(fn ($item) => [
                    'id' => $item->id,
                    'employee_id' => $item->employee_id,
                    'employee_label' => $item->employee
                        ? $item->employee->employee_code.' - '.$item->employee->full_name
                        : '-',
                    'base_salary' => $item->base_salary,
                    'allowances_total' => $item->allowances_total,
                    'kasbon_deduction' => $item->kasbon_deduction,
                    'denda_deduction' => $item->denda_deduction,
                    'deductions_total' => $item->deductions_total,
                    'net_salary' => $item->net_salary,
                    'allowance_breakdown' => $item->allowance_breakdown ?? [],
                ])->values()
                : [],
        ]);
    }

    /**
     * Auto-generate payroll for selected period.
     */
    public function generate(GeneratePayrollRequest $request): RedirectResponse
    {
        $period = $request->validated('period');
        $start = Carbon::createFromFormat('Y-m', $period)->startOfMonth();
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

        DB::transaction(function () use ($employees, $period, $start, $end, $request): void {
            $run = PayrollRun::query()->updateOrCreate(
                ['period' => $period],
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

            $items = $employees->map(function (Employee $employee) use ($run): array {
                $baseSalary = (float) ($employee->base_salary ?? 0);

                $allowanceGrouped = $employee->allowances
                    ->groupBy('name')
                    ->map(fn ($rows) => round((float) $rows->sum('amount'), 2))
                    ->sortKeys();

                $allowancesTotal = round((float) $allowanceGrouped->sum(), 2);

                $kasbonDeduction = round((float) $employee->deductions
                    ->where('type', 'kasbon')
                    ->sum('amount'), 2);

                $dendaDeduction = round((float) $employee->deductions
                    ->where('type', 'denda')
                    ->sum('amount'), 2);

                $deductionsTotal = round($kasbonDeduction + $dendaDeduction, 2);
                $netSalary = round(max(($baseSalary + $allowancesTotal) - $deductionsTotal, 0), 2);

                return [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                    'base_salary' => $baseSalary,
                    'allowances_total' => $allowancesTotal,
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
        });

        return to_route('hris.payrolls.index', ['period' => $period]);
    }

    /**
     * Save/finalize generated payroll.
     */
    public function save(PayrollRun $payrollRun, Request $request): RedirectResponse
    {
        $payrollRun->update([
            'is_saved' => true,
            'saved_at' => now(),
            'saved_by' => $request->user()?->id,
        ]);

        return to_route('hris.payrolls.index', ['period' => $payrollRun->period]);
    }
}
