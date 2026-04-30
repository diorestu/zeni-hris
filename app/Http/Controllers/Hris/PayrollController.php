<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\GeneratePayrollRequest;
use App\Jobs\SendPayslipToWhatsApp;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeDeduction;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Support\PayrollTax;
use App\Support\WhatsAppPhone;
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
                'items.employee:id,employee_code,first_name,last_name,phone',
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
                    'can_send_payslip' => $item->employee?->phone
                        ? WhatsAppPhone::isValid($item->employee->phone)
                        : false,
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
        ]);
    }

    /**
     * Auto-generate payroll for selected period.
     */
    public function generate(GeneratePayrollRequest $request): RedirectResponse
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

        DB::transaction(function () use ($employees, $ownerId, $period, $start, $end, $request): void {
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
                        ->withoutGlobalScopes()
                        ->where('user_id', $employee->user_id)
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

                $kasbonDeduction = round((float) EmployeeDeduction::query()
                    ->withoutGlobalScopes()
                    ->where('user_id', $employee->user_id)
                    ->where('employee_id', $employee->id)
                    ->where('type', 'kasbon')
                    ->whereBetween('deduction_date', [$start->toDateString(), $end->toDateString()])
                    ->sum('amount'), 2);

                $dendaDeduction = round((float) EmployeeDeduction::query()
                    ->withoutGlobalScopes()
                    ->where('user_id', $employee->user_id)
                    ->where('employee_id', $employee->id)
                    ->where('type', 'denda')
                    ->whereBetween('deduction_date', [$start->toDateString(), $end->toDateString()])
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

    public function sendPayslips(PayrollRun $payrollRun, Request $request): RedirectResponse
    {
        if (! $payrollRun->is_saved) {
            return back()->with('error', 'Simpan payroll terlebih dahulu sebelum mengirim payslip ke WhatsApp.');
        }

        $payrollRun->loadMissing([
            'items.employee:id,employee_code,first_name,last_name,email,phone,division_id,position_id',
            'items.employee.division:id,name',
            'items.employee.position:id,name',
        ]);

        if ($payrollRun->items->isEmpty()) {
            return back()->with('error', 'Tidak ada item payroll yang bisa dikirim.');
        }

        $ownerId = $request->user()->accountOwnerId();
        $queued = 0;
        $skipped = 0;

        foreach ($payrollRun->items as $item) {
            $employee = $item->employee;

            if (! $employee || ! $employee->phone || ! WhatsAppPhone::isValid($employee->phone)) {
                $skipped++;

                continue;
            }

            SendPayslipToWhatsApp::dispatch($item->id, $ownerId)
                ->delay(now()->addSeconds(intdiv($queued, 10) * 60));

            $queued++;
        }

        $message = sprintf(
            'Payslip masuk queue untuk %d karyawan. %d dilewati karena nomor WhatsApp tidak valid.',
            $queued,
            $skipped,
        );

        return back()->with($queued > 0 ? 'success' : 'error', $message);
    }

    public function sendPayslip(PayrollRun $payrollRun, PayrollItem $payrollItem, Request $request): RedirectResponse
    {
        if (! $payrollRun->is_saved) {
            return back()->with('error', 'Simpan payroll terlebih dahulu sebelum mengirim payslip ke WhatsApp.');
        }

        abort_unless((int) $payrollItem->payroll_run_id === (int) $payrollRun->id, 404);

        $payrollItem->loadMissing('employee:id,employee_code,first_name,last_name,phone');

        if (! $payrollItem->employee?->phone || ! WhatsAppPhone::isValid($payrollItem->employee->phone)) {
            return back()->with('error', 'Nomor WhatsApp karyawan tidak valid.');
        }

        SendPayslipToWhatsApp::dispatch($payrollItem->id, $request->user()->accountOwnerId());

        return back()->with('success', 'Payslip karyawan masuk queue pengiriman WhatsApp.');
    }
}
