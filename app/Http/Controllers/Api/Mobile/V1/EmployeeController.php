<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    use InteractsWithMobileApiResponse;

    public function index(Request $request): JsonResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'division_id' => ['nullable', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'status' => ['nullable', 'string', 'max:30'],
            'is_active' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 15);

        $paginator = Employee::query()
            ->with(['division:id,name', 'position:id,name'])
            ->when(($validated['search'] ?? '') !== '', function ($query) use ($validated): void {
                $search = $validated['search'];

                $query->where(function ($builder) use ($search): void {
                    $builder
                        ->where('employee_code', 'like', '%'.$search.'%')
                        ->orWhere('first_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->when(isset($validated['division_id']), fn ($query) => $query->where('division_id', $validated['division_id']))
            ->when(($validated['status'] ?? '') !== '', fn ($query) => $query->where('employment_status', $validated['status']))
            ->when(isset($validated['is_active']), fn ($query) => $query->where('is_active', $validated['is_active']))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($paginator, fn (Employee $employee) => [
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'employment_status' => $employee->employment_status,
            'employment_type' => $employee->employment_type,
            'hire_date' => $employee->hire_date?->format('Y-m-d'),
            'is_active' => $employee->is_active,
            'division' => $employee->division ? [
                'id' => $employee->division->id,
                'name' => $employee->division->name,
            ] : null,
            'position' => $employee->position ? [
                'id' => $employee->position->id,
                'name' => $employee->position->name,
            ] : null,
        ], 'Daftar karyawan berhasil diambil.');
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee->load([
            'division:id,name',
            'position:id,name,level',
            'manager:id,employee_code,first_name,last_name',
            'bankAccounts:id,employee_id,bank_name,account_number,account_holder_name,branch,currency,is_primary',
            'allowances:id,employee_id,name,amount,is_active,effective_start_date,effective_end_date,notes',
        ]);

        return $this->success([
            'id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'gender' => $employee->gender,
            'birth_date' => $employee->birth_date?->format('Y-m-d'),
            'last_education' => $employee->last_education,
            'marital_status' => $employee->marital_status,
            'children_count' => $employee->children_count,
            'hire_date' => $employee->hire_date?->format('Y-m-d'),
            'employment_status' => $employee->employment_status,
            'employment_type' => $employee->employment_type,
            'base_salary' => $employee->base_salary,
            'address' => $employee->address,
            'family_card_number' => $employee->family_card_number,
            'bpjs_kesehatan_number' => $employee->bpjs_kesehatan_number,
            'bpjs_ketenagakerjaan_number' => $employee->bpjs_ketenagakerjaan_number,
            'sim_a_number' => $employee->sim_a_number,
            'sim_b_number' => $employee->sim_b_number,
            'sim_c_number' => $employee->sim_c_number,
            'biological_mother_name' => $employee->biological_mother_name,
            'notes' => $employee->notes,
            'is_active' => $employee->is_active,
            'division' => $employee->division ? [
                'id' => $employee->division->id,
                'name' => $employee->division->name,
            ] : null,
            'position' => $employee->position ? [
                'id' => $employee->position->id,
                'name' => $employee->position->name,
                'level' => (string) $employee->position->level,
            ] : null,
            'manager' => $employee->manager ? [
                'id' => $employee->manager->id,
                'employee_code' => $employee->manager->employee_code,
                'full_name' => $employee->manager->full_name,
            ] : null,
            'bank_accounts' => $employee->bankAccounts
                ->sortByDesc('is_primary')
                ->values()
                ->map(fn ($bankAccount) => [
                    'id' => $bankAccount->id,
                    'bank_name' => $bankAccount->bank_name,
                    'account_number' => $bankAccount->account_number,
                    'account_holder_name' => $bankAccount->account_holder_name,
                    'branch' => $bankAccount->branch,
                    'currency' => $bankAccount->currency,
                    'is_primary' => $bankAccount->is_primary,
                ]),
            'allowances' => $employee->allowances
                ->sortBy('name')
                ->values()
                ->map(fn ($allowance) => [
                    'id' => $allowance->id,
                    'name' => $allowance->name,
                    'amount' => $allowance->amount,
                    'is_active' => $allowance->is_active,
                    'effective_start_date' => $allowance->effective_start_date?->format('Y-m-d'),
                    'effective_end_date' => $allowance->effective_end_date?->format('Y-m-d'),
                    'notes' => $allowance->notes,
                ]),
        ]);
    }
}
