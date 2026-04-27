<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreEmployeeAllowanceRequest;
use App\Http\Requests\Hris\UpdateEmployeeAllowanceRequest;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use Illuminate\Http\RedirectResponse;

class EmployeeAllowanceController extends Controller
{
    /**
     * Store a newly created allowance for the employee.
     */
    public function store(StoreEmployeeAllowanceRequest $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validated();

        $employee->allowances()->create([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Update allowance of the employee.
     */
    public function update(
        UpdateEmployeeAllowanceRequest $request,
        Employee $employee,
        EmployeeAllowance $employeeAllowance
    ): RedirectResponse {
        abort_if($employeeAllowance->employee_id !== $employee->id, 404);

        $validated = $request->validated();

        $employeeAllowance->update([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Remove allowance from the employee.
     */
    public function destroy(Employee $employee, EmployeeAllowance $employeeAllowance): RedirectResponse
    {
        abort_if($employeeAllowance->employee_id !== $employee->id, 404);

        $employeeAllowance->delete();

        return back();
    }
}
