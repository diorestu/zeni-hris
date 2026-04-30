<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StorePayrollKasbonRequest;
use App\Http\Requests\Hris\UpdatePayrollKasbonRequest;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class KasbonController extends Controller
{
    /**
     * Display kasbon management page.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $validated['period'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m-d', $period.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $kasbons = EmployeeDeduction::query()
            ->with('employee:id,employee_code,first_name,last_name')
            ->where('type', 'kasbon')
            ->whereBetween('deduction_date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('deduction_date')
            ->orderByDesc('id')
            ->get();

        $employeeOptions = Employee::query()
            ->select(['id', 'employee_code', 'first_name', 'last_name'])
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ])
            ->values();

        return Inertia::render('hris/kasbons/index', [
            'period' => $period,
            'kasbons' => $kasbons
                ->map(fn (EmployeeDeduction $deduction) => [
                    'id' => $deduction->id,
                    'employee_id' => $deduction->employee_id,
                    'employee_label' => $deduction->employee
                        ? $deduction->employee->employee_code.' - '.$deduction->employee->full_name
                        : '-',
                    'amount' => $deduction->amount,
                    'deduction_date' => $deduction->deduction_date?->format('Y-m-d'),
                    'notes' => $deduction->notes,
                ])
                ->values(),
            'employeeOptions' => $employeeOptions,
        ]);
    }

    /**
     * Store kasbon deduction.
     */
    public function store(StorePayrollKasbonRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        EmployeeDeduction::query()->create([
            'employee_id' => $validated['employee_id'],
            'type' => 'kasbon',
            'amount' => $validated['amount'],
            'deduction_date' => $validated['deduction_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $period = $validated['period'] ?? Carbon::parse($validated['deduction_date'])->format('Y-m');

        return to_route('hris.kasbons.index', ['period' => $period]);
    }

    /**
     * Update kasbon deduction.
     */
    public function update(
        UpdatePayrollKasbonRequest $request,
        EmployeeDeduction $employeeDeduction
    ): RedirectResponse {
        abort_if($employeeDeduction->type !== 'kasbon', 404);

        $validated = $request->validated();

        $employeeDeduction->update([
            'employee_id' => $validated['employee_id'],
            'type' => 'kasbon',
            'amount' => $validated['amount'],
            'deduction_date' => $validated['deduction_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $period = $validated['period'] ?? Carbon::parse($validated['deduction_date'])->format('Y-m');

        return to_route('hris.kasbons.index', ['period' => $period]);
    }

    /**
     * Delete kasbon deduction.
     */
    public function destroy(EmployeeDeduction $employeeDeduction, Request $request): RedirectResponse
    {
        abort_if($employeeDeduction->type !== 'kasbon', 404);

        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $validated['period']
            ?? $employeeDeduction->deduction_date?->format('Y-m')
            ?? now()->format('Y-m');

        $employeeDeduction->delete();

        return to_route('hris.kasbons.index', ['period' => $period]);
    }
}
