<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreEmployeeRequest;
use App\Http\Requests\Hris\UpdateEmployeeRequest;
use App\Models\CompanySetting;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Position;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display the HRIS employee dashboard page.
     */
    public function index(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $rawFilters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'division_id' => ['nullable', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'status' => ['nullable', 'string'],
            'division_search' => ['nullable', 'string', 'max:100'],
            'position_search' => ['nullable', 'string', 'max:100'],
        ]);

        $filters = [
            'search' => $rawFilters['search'] ?? '',
            'division_id' => isset($rawFilters['division_id']) ? (string) $rawFilters['division_id'] : '',
            'status' => $rawFilters['status'] ?? '',
            'division_search' => $rawFilters['division_search'] ?? '',
            'position_search' => $rawFilters['position_search'] ?? '',
        ];

        $employees = Employee::query()
            ->with([
                'division:id,name',
                'position:id,name',
                'manager:id,employee_code,first_name,last_name',
                'bankAccounts:id,employee_id,bank_name,account_number,account_holder_name,branch,currency,is_primary',
                'allowances:id,employee_id,name,amount,is_active,effective_start_date,effective_end_date,notes',
            ])
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('employee_code', 'like', '%'.$filters['search'].'%')
                        ->orWhere('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['division_id'] !== '', fn ($query) => $query->where('division_id', $filters['division_id']))
            ->when($filters['status'] !== '', fn ($query) => $query->where('employment_status', $filters['status']))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Employee $employee) => [
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
                'division_id' => $employee->division_id,
                'position_id' => $employee->position_id,
                'manager_id' => $employee->manager_id,
                'base_salary' => $employee->base_salary,
                'address' => $employee->address,
                'family_card_number' => $employee->family_card_number,
                'bpjs_kesehatan_number' => $employee->bpjs_kesehatan_number,
                'bpjs_ketenagakerjaan_number' => $employee->bpjs_ketenagakerjaan_number,
                'sim_a_number' => $employee->sim_a_number,
                'sim_b_number' => $employee->sim_b_number,
                'sim_c_number' => $employee->sim_c_number,
                'biological_mother_name' => $employee->biological_mother_name,
                'emergency_contact_name' => $employee->emergency_contact_name,
                'emergency_contact_phone' => $employee->emergency_contact_phone,
                'notes' => $employee->notes,
                'is_active' => $employee->is_active,
                'division' => $employee->division ? [
                    'id' => $employee->division->id,
                    'name' => $employee->division->name,
                ] : null,
                'position' => $employee->position ? [
                    'id' => $employee->position->id,
                    'name' => $employee->position->name,
                ] : null,
                'manager' => $employee->manager ? [
                    'id' => $employee->manager->id,
                    'full_name' => $employee->manager->full_name,
                    'employee_code' => $employee->manager->employee_code,
                ] : null,
                'bank_accounts' => $employee->bankAccounts
                    ->sortByDesc('is_primary')
                    ->map(fn ($bankAccount) => [
                        'id' => $bankAccount->id,
                        'bank_name' => $bankAccount->bank_name,
                        'account_number' => $bankAccount->account_number,
                        'account_holder_name' => $bankAccount->account_holder_name,
                        'branch' => $bankAccount->branch,
                        'currency' => $bankAccount->currency,
                        'is_primary' => $bankAccount->is_primary,
                    ])
                    ->values(),
                'allowances' => $employee->allowances
                    ->sortBy('name')
                    ->map(fn ($allowance) => [
                        'id' => $allowance->id,
                        'name' => $allowance->name,
                        'amount' => $allowance->amount,
                        'is_active' => $allowance->is_active,
                        'effective_start_date' => $allowance->effective_start_date?->format('Y-m-d'),
                        'effective_end_date' => $allowance->effective_end_date?->format('Y-m-d'),
                        'notes' => $allowance->notes,
                    ])
                    ->values(),
            ]);

        $divisions = Division::query()
            ->withCount(['employees', 'positions'])
            ->when($filters['division_search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('code', 'like', '%'.$filters['division_search'].'%')
                        ->orWhere('name', 'like', '%'.$filters['division_search'].'%');
                });
            })
            ->orderBy('name')
            ->paginate(5, ['*'], 'division_page')
            ->withQueryString()
            ->through(fn (Division $division) => [
                'id' => $division->id,
                'code' => $division->code,
                'name' => $division->name,
                'description' => $division->description,
                'is_active' => $division->is_active,
                'employees_count' => $division->employees_count,
                'positions_count' => $division->positions_count,
            ]);

        $positions = Position::query()
            ->with(['division:id,name', 'parentPosition:id,name'])
            ->withCount('employees')
            ->when($filters['position_search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('code', 'like', '%'.$filters['position_search'].'%')
                        ->orWhere('name', 'like', '%'.$filters['position_search'].'%')
                        ->orWhere('level', 'like', '%'.$filters['position_search'].'%');
                });
            })
            ->orderByRaw('CASE WHEN parent_position_id IS NULL THEN 0 ELSE 1 END')
            ->orderBy('parent_position_id')
            ->orderBy('name')
            ->paginate(5, ['*'], 'position_page')
            ->withQueryString()
            ->through(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'parent_position_id' => $position->parent_position_id,
                'code' => $position->code,
                'name' => $position->name,
                'level' => $position->level,
                'level_label' => match ((string) $position->level) {
                    '0' => 'Direktur Utama',
                    '1' => 'Direktur Divisi',
                    '2' => 'Manager',
                    '3' => 'Senior Staff / Supervisor',
                    '4' => 'Staff',
                    default => $position->level,
                },
                'description' => $position->description,
                'is_active' => $position->is_active,
                'employees_count' => $position->employees_count,
                'division' => $position->division ? [
                    'id' => $position->division->id,
                    'name' => $position->division->name,
                ] : null,
                'parent_position' => $position->parentPosition ? [
                    'id' => $position->parentPosition->id,
                    'name' => $position->parentPosition->name,
                ] : null,
            ]);

        $managerOptions = Employee::query()
            ->select(['id', 'employee_code', 'first_name', 'last_name'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
            ]);

        $positionOptions = Position::query()
            ->with('division:id,name')
            ->withCount('employees')
            ->orderBy('name')
            ->get()
            ->map(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'name' => $position->name,
                'division_name' => $position->division?->name,
                'employees_count' => $position->employees_count,
            ])
            ->values();

        $companySetting = CompanySetting::query()->firstOrCreate(
            ['user_id' => $ownerId],
            [
                'name' => 'Perusahaan',
                'details' => null,
                'employee_code_prefix' => 'EMP',
                'employee_code_digits' => 4,
                'employee_code_next_number' => 1,
            ],
        );

        $nextEmployeeCode = $this->previewNextEmployeeCode($companySetting);

        return Inertia::render('hris/employees/index', [
            'employees' => $employees,
            'divisions' => $divisions,
            'positions' => $positions,
            'positionOptions' => $positionOptions,
            'managerOptions' => $managerOptions,
            'nextEmployeeCode' => $nextEmployeeCode,
            'filters' => $filters,
            'stats' => [
                'employees_total' => Employee::query()->count(),
                'employees_active' => Employee::query()->where('is_active', true)->count(),
                'divisions_total' => Division::query()->count(),
                'positions_total' => Position::query()->count(),
            ],
            'options' => [
                'employment_statuses' => ['active', 'probation', 'on_leave', 'resigned'],
                'employment_types' => ['permanent', 'contract', 'internship', 'freelance'],
                'genders' => ['male', 'female', 'other'],
                'marital_statuses' => ['single', 'married', 'divorced', 'widowed'],
                'last_education_levels' => [
                    'SD',
                    'SMP',
                    'SMA/SMK',
                    'D1',
                    'D2',
                    'D3',
                    'D4',
                    'S1',
                    'S2',
                    'S3',
                ],
                'position_levels' => [
                    ['value' => '0', 'label' => 'Level 0 - Direktur Utama'],
                    ['value' => '1', 'label' => 'Level 1 - Direktur Divisi'],
                    ['value' => '2', 'label' => 'Level 2 - Manager'],
                    ['value' => '3', 'label' => 'Level 3 - Senior Staff / Supervisor'],
                    ['value' => '4', 'label' => 'Level 4 - Staff'],
                ],
            ],
        ]);
    }

    /**
     * Export employees data to XLS-compatible file.
     */
    public function export(Request $request): StreamedResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'division_id' => ['nullable', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'status' => ['nullable', 'string'],
        ]);

        $rows = Employee::query()
            ->with(['division:id,name', 'position:id,name'])
            ->when(($filters['search'] ?? '') !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('employee_code', 'like', '%'.$filters['search'].'%')
                        ->orWhere('first_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('last_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when(isset($filters['division_id']), fn ($query) => $query->where('division_id', $filters['division_id']))
            ->when(($filters['status'] ?? '') !== '', fn ($query) => $query->where('employment_status', $filters['status']))
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $fileName = 'employees_'.now()->format('Ymd_His').'.xls';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'wb');

            fputcsv($out, [
                'Kode Pegawai',
                'Nama',
                'Email',
                'Telepon',
                'Divisi',
                'Jabatan',
                'Status',
                'Tanggal Masuk',
            ], "\t");

            foreach ($rows as $employee) {
                fputcsv($out, [
                    $employee->employee_code,
                    $employee->full_name,
                    $employee->email,
                    $employee->phone,
                    $employee->division?->name,
                    $employee->position?->name,
                    $employee->employment_status,
                    $employee->hire_date?->format('Y-m-d'),
                ], "\t");
            }

            fclose($out);
        }, $fileName, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

    /**
     * Store a newly created employee in storage.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);
        unset($validated['employee_code']);

        DB::transaction(function () use ($request, $validated): void {
            $ownerId = $request->user()->accountOwnerId();

            $setting = CompanySetting::query()->lockForUpdate()->firstOrCreate(
                ['user_id' => $ownerId],
                [
                    'name' => 'Perusahaan',
                    'details' => null,
                    'employee_code_prefix' => 'EMP',
                    'employee_code_digits' => 4,
                    'employee_code_next_number' => 1,
                ],
            );

            [$employeeCode, $nextNumber] = $this->reserveEmployeeCode($setting);

            Employee::create([
                ...$validated,
                'employee_code' => $employeeCode,
                'is_active' => $request->boolean('is_active', true),
            ]);

            $setting->update([
                'employee_code_next_number' => $nextNumber,
            ]);
        });

        return back();
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);

        $employee->update([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back();
    }

    /**
     * Remove the specified employee from storage.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return back();
    }

    /**
     * Build preview employee code without incrementing sequence.
     */
    private function previewNextEmployeeCode(CompanySetting $setting): string
    {
        [$prefix, $digits, $nextNumber] = $this->normalizedEmployeeCodeFormat($setting);
        $candidate = $nextNumber;

        for ($attempt = 0; $attempt < 5000; $attempt++) {
            $code = $this->formatEmployeeCode($prefix, $digits, $candidate);
            $exists = Employee::query()
                ->withoutGlobalScopes()
                ->where('employee_code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }

            $candidate++;
        }

        throw ValidationException::withMessages([
            'employee_code' => 'Gagal menyiapkan kode karyawan otomatis. Silakan atur ulang format kode di Settings.',
        ]);
    }

    /**
     * Reserve unique employee code and return next sequence number.
     *
     * @return array{0: string, 1: int}
     */
    private function reserveEmployeeCode(CompanySetting $setting): array
    {
        [$prefix, $digits, $nextNumber] = $this->normalizedEmployeeCodeFormat($setting);
        $candidate = $nextNumber;

        for ($attempt = 0; $attempt < 5000; $attempt++) {
            $code = $this->formatEmployeeCode($prefix, $digits, $candidate);
            $exists = Employee::query()
                ->withoutGlobalScopes()
                ->where('employee_code', $code)
                ->exists();

            if (! $exists) {
                return [$code, $candidate + 1];
            }

            $candidate++;
        }

        throw ValidationException::withMessages([
            'employee_code' => 'Gagal membuat kode karyawan otomatis. Silakan atur ulang format kode di Settings.',
        ]);
    }

    /**
     * Normalize employee code format from company settings.
     *
     * @return array{0: string, 1: int, 2: int}
     */
    private function normalizedEmployeeCodeFormat(CompanySetting $setting): array
    {
        $prefix = strtoupper((string) ($setting->employee_code_prefix ?? 'EMP'));
        $prefix = preg_replace('/[^A-Z0-9_-]/', '', $prefix) ?: 'EMP';
        $digits = max(1, min(8, (int) ($setting->employee_code_digits ?? 4)));
        $nextNumber = max(1, (int) ($setting->employee_code_next_number ?? 1));

        return [$prefix, $digits, $nextNumber];
    }

    /**
     * Convert sequence number to employee code string.
     */
    private function formatEmployeeCode(string $prefix, int $digits, int $sequence): string
    {
        return $prefix.'-'.str_pad((string) $sequence, $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Ensure selected position belongs to selected division.
     */
    private function ensurePositionMatchesDivision(null|int|string $positionId, null|int|string $divisionId): void
    {
        if ($positionId === null || $divisionId === null || $positionId === '' || $divisionId === '') {
            return;
        }

        $positionDivisionId = Position::query()->whereKey($positionId)->value('division_id');

        if ($positionDivisionId !== null && (int) $positionDivisionId !== (int) $divisionId) {
            throw ValidationException::withMessages([
                'position_id' => 'Jabatan harus berasal dari divisi yang sama.',
            ]);
        }
    }
}
