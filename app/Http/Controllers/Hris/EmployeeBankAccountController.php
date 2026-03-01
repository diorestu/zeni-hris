<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreEmployeeBankAccountRequest;
use App\Http\Requests\Hris\UpdateEmployeeBankAccountRequest;
use App\Models\Employee;
use App\Models\EmployeeBankAccount;
use Illuminate\Http\RedirectResponse;

class EmployeeBankAccountController extends Controller
{
    /**
     * Store a newly created bank account for employee.
     */
    public function store(Employee $employee, StoreEmployeeBankAccountRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $isPrimary = $request->boolean('is_primary', false);

        if (! $employee->bankAccounts()->exists()) {
            $isPrimary = true;
        }

        if ($isPrimary) {
            $employee->bankAccounts()->update(['is_primary' => false]);
        }

        $employee->bankAccounts()->create([
            ...$validated,
            'is_primary' => $isPrimary,
        ]);

        return back();
    }

    /**
     * Update the specified bank account for employee.
     */
    public function update(
        Employee $employee,
        EmployeeBankAccount $employeeBankAccount,
        UpdateEmployeeBankAccountRequest $request
    ): RedirectResponse {
        $this->ensureBankAccountBelongsToEmployee($employee, $employeeBankAccount);

        $validated = $request->validated();
        $isPrimary = $request->boolean('is_primary', false);

        if ($isPrimary) {
            $employee->bankAccounts()
                ->whereKeyNot($employeeBankAccount->id)
                ->update(['is_primary' => false]);
        }

        $employeeBankAccount->update([
            ...$validated,
            'is_primary' => $isPrimary,
        ]);

        if (! $employee->bankAccounts()->where('is_primary', true)->exists()) {
            $employeeBankAccount->update(['is_primary' => true]);
        }

        return back();
    }

    /**
     * Remove the specified bank account for employee.
     */
    public function destroy(Employee $employee, EmployeeBankAccount $employeeBankAccount): RedirectResponse
    {
        $this->ensureBankAccountBelongsToEmployee($employee, $employeeBankAccount);

        $employeeBankAccount->delete();

        if (! $employee->bankAccounts()->where('is_primary', true)->exists()) {
            $employee->bankAccounts()->oldest('id')->limit(1)->update(['is_primary' => true]);
        }

        return back();
    }

    /**
     * Ensure account belongs to the given employee.
     */
    private function ensureBankAccountBelongsToEmployee(Employee $employee, EmployeeBankAccount $employeeBankAccount): void
    {
        abort_unless($employeeBankAccount->employee_id === $employee->id, 404);
    }
}
