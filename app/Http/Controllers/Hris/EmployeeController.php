<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreEmployeeRequest;
use App\Http\Requests\Hris\UpdateEmployeeRequest;
use App\Models\CompanySetting;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Position;
use App\Models\User;
use App\Services\UserPortalAccountService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class EmployeeController extends Controller
{
    /**
     * Display the HRIS employee dashboard page.
     */
    public function index(Request $request): InertiaResponse
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
                'pph21_method' => $employee->pph21_method,
                'pph21_rate' => (int) $employee->pph21_rate,
                'ptkp_category' => $employee->ptkp_category,
                'division_id' => $employee->division_id,
                'position_id' => $employee->position_id,
                'manager_id' => $employee->manager_id,
                'base_salary' => $employee->base_salary ? (int) $employee->base_salary : null,
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
                'portal_user' => (function () use ($employee) {
                    if (! $employee->email && ! $employee->phone) {
                        return null;
                    }

                    return User::query()
                        ->where('parent_user_id', $employee->user_id)
                        ->where(function ($query) use ($employee): void {
                            if ($employee->email) {
                                $query->where('email', $employee->email);
                            }

                            if ($employee->phone) {
                                $employee->email
                                    ? $query->orWhere('phone', $employee->phone)
                                    : $query->where('phone', $employee->phone);
                            }
                        })
                        ->first(['id', 'email', 'phone', 'requires_password_change'])
                        ?->toArray();
                })(),
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
                    '5' => 'Operator / Pelaksana',
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
                'code' => $position->code,
                'name' => $position->name,
                'level' => $position->level,
                'division_name' => $position->division?->name,
                'employees_count' => $position->employees_count,
            ])
            ->values();

        $divisionOptions = Division::query()
            ->withCount('employees')
            ->orderBy('name')
            ->get()
            ->map(fn (Division $division) => [
                'id' => $division->id,
                'code' => $division->code,
                'name' => $division->name,
                'employees_count' => $division->employees_count,
            ])
            ->values();

        return Inertia::render('hris/employees/index', [
            'employees' => $employees,
            'divisions' => $divisions,
            'positions' => $positions,
            'divisionOptions' => $divisionOptions,
            'positionOptions' => $positionOptions,
            'managerOptions' => $managerOptions,
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
                'pph21_methods' => [
                    [
                        'value' => 'ter_harian',
                        'label' => 'Mekanisme TER Harian (Pegawai Tidak Tetap)',
                        'description' => 'Untuk pegawai tidak tetap atau tenaga lepas dengan upah harian/mingguan/satuan.',
                    ],
                    [
                        'value' => 'gross',
                        'label' => 'Metode Gross (Gaji Kotor)',
                        'description' => 'PPh21 ditanggung karyawan dan mengurangi gaji bruto.',
                    ],
                    [
                        'value' => 'net',
                        'label' => 'Metode Net (Gaji Bersih)',
                        'description' => 'PPh21 ditanggung perusahaan sebagai beban perusahaan.',
                    ],
                    [
                        'value' => 'gross_up',
                        'label' => 'Metode Gross Up (Tunjangan Pajak)',
                        'description' => 'Perusahaan memberi tunjangan pajak sebesar potongan pajak yang dikenakan.',
                    ],
                ],
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
                    ['value' => '5', 'label' => 'Level 5 - Operator / Pelaksana'],
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
     * Download employee import template file.
     */
    public function downloadImportTemplate(): StreamedResponse
    {
        $fileName = 'employee_import_template.xlsx';
        $headers = [
            'full_name',
            'email',
            'phone',
            'gender',
            'birth_date',
            'last_education',
            'marital_status',
            'children_count',
            'hire_date',
            'employment_status',
            'employment_type',
            'pph21_method',
            'pph21_rate',
            'division_code',
            'position_code',
            'manager_employee_code',
            'base_salary',
            'address',
            'family_card_number',
            'bpjs_kesehatan_number',
            'bpjs_ketenagakerjaan_number',
            'sim_a_number',
            'sim_b_number',
            'sim_c_number',
            'biological_mother_name',
            'emergency_contact_name',
            'emergency_contact_phone',
            'notes',
            'is_active',
        ];

        return response()->streamDownload(function () use ($headers): void {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();

            foreach ($headers as $index => $header) {
                $sheet->setCellValue(Coordinate::stringFromColumnIndex($index + 1).'1', $header);
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Import employees from CSV template.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'import_file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:4096'],
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('import_file');
        $ownerId = $request->user()->accountOwnerId();
        $rows = $this->parseImportRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'import_file' => 'File import kosong atau tidak memiliki data karyawan.',
            ]);
        }

        $divisionMap = Division::query()
            ->where('user_id', $ownerId)
            ->get()
            ->keyBy(fn (Division $division) => strtoupper((string) $division->code));

        $positionMap = Position::query()
            ->where('user_id', $ownerId)
            ->get()
            ->keyBy(fn (Position $position) => strtoupper((string) $position->code));

        DB::transaction(function () use ($rows, $ownerId, $divisionMap, $positionMap): void {
            foreach ($rows as $rowNumber => $row) {
                $divisionCode = strtoupper((string) ($row['division_code'] ?? ''));
                $positionCode = strtoupper((string) ($row['position_code'] ?? ''));
                $managerCode = strtoupper((string) ($row['manager_employee_code'] ?? ''));

                $division = $divisionCode !== '' ? $divisionMap->get($divisionCode) : null;
                $position = $positionCode !== '' ? $positionMap->get($positionCode) : null;
                $managerId = null;

                if ($managerCode !== '') {
                    $managerId = Employee::query()
                        ->where('user_id', $ownerId)
                        ->where('employee_code', $managerCode)
                        ->value('id');
                }

                $payload = [
                    'full_name' => $this->nullableString($row['full_name'] ?? null) ?? '',
                    'employee_code' => null,
                    'first_name' => $this->nullableString($row['full_name'] ?? null) ?? '',
                    'last_name' => null,
                    'email' => $this->nullableString($row['email'] ?? null),
                    'phone' => $this->nullableString($row['phone'] ?? null),
                    'gender' => $this->nullableString($row['gender'] ?? null),
                    'birth_date' => $this->nullableString($row['birth_date'] ?? null),
                    'last_education' => $this->nullableString($row['last_education'] ?? null),
                    'marital_status' => $this->nullableString($row['marital_status'] ?? null),
                    'children_count' => $this->nullableInteger($row['children_count'] ?? null),
                    'hire_date' => $this->nullableString($row['hire_date'] ?? null),
                    'employment_status' => $this->nullableString($row['employment_status'] ?? null),
                    'employment_type' => $this->nullableString($row['employment_type'] ?? null),
                    'pph21_method' => $this->nullableString($row['pph21_method'] ?? null) ?? 'gross',
                    'pph21_rate' => $this->nullableString($row['pph21_rate'] ?? null) ?? '0',
                    'division_id' => $division?->id,
                    'position_id' => $position?->id,
                    'manager_id' => $managerId,
                    'base_salary' => $this->normalizeImportedAmount($row['base_salary'] ?? null),
                    'address' => $this->nullableString($row['address'] ?? null),
                    'family_card_number' => $this->nullableString($row['family_card_number'] ?? null),
                    'bpjs_kesehatan_number' => $this->nullableString($row['bpjs_kesehatan_number'] ?? null),
                    'bpjs_ketenagakerjaan_number' => $this->nullableString($row['bpjs_ketenagakerjaan_number'] ?? null),
                    'sim_a_number' => $this->nullableString($row['sim_a_number'] ?? null),
                    'sim_b_number' => $this->nullableString($row['sim_b_number'] ?? null),
                    'sim_c_number' => $this->nullableString($row['sim_c_number'] ?? null),
                    'biological_mother_name' => $this->nullableString($row['biological_mother_name'] ?? null),
                    'emergency_contact_name' => $this->nullableString($row['emergency_contact_name'] ?? null),
                    'emergency_contact_phone' => $this->nullableString($row['emergency_contact_phone'] ?? null),
                    'notes' => $this->nullableString($row['notes'] ?? null),
                    'is_active' => $this->normalizeImportedBoolean($row['is_active'] ?? null),
                ];

                $validator = Validator::make($payload, [
                    'full_name' => ['required', 'string', 'max:150'],
                    'employee_code' => ['nullable', 'string', 'max:30'],
                    'first_name' => ['nullable', 'string', 'max:100'],
                    'last_name' => ['nullable', 'string', 'max:100'],
                    'email' => [
                        'nullable',
                        'email',
                        'max:150',
                        Rule::unique('employees', 'email')->where('user_id', $ownerId),
                    ],
                    'phone' => ['nullable', 'string', 'max:30'],
                    'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
                    'birth_date' => ['nullable', 'date'],
                    'last_education' => ['nullable', 'string', 'max:100'],
                    'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
                    'children_count' => ['nullable', 'integer', 'min:0'],
                    'hire_date' => ['required', 'date'],
                    'employment_status' => ['required', Rule::in(['active', 'probation', 'on_leave', 'resigned'])],
                    'employment_type' => ['required', Rule::in(['permanent', 'contract', 'internship', 'freelance'])],
                    'pph21_method' => ['required', Rule::in(['ter_harian', 'gross', 'net', 'gross_up'])],
                    'pph21_rate' => ['required', 'numeric', 'min:0', 'max:100'],
                    'division_id' => ['required', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
                    'position_id' => [
                        'required',
                        'integer',
                        Rule::exists('positions', 'id')->where('user_id', $ownerId),
                        function (string $attribute, mixed $value, \Closure $fail) use ($ownerId): void {
                            $positionLevel = Position::query()->whereKey($value)->value('level');

                            if (! in_array((string) $positionLevel, ['0', '1', '2'], true)) {
                                return;
                            }

                            $isOccupied = Employee::query()
                                ->where('user_id', $ownerId)
                                ->where('position_id', $value)
                                ->exists();

                            if ($isOccupied) {
                                $fail('Jabatan level 0-2 hanya boleh diisi oleh satu orang.');
                            }
                        },
                    ],
                    'manager_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
                    'base_salary' => ['nullable', 'numeric', 'min:0'],
                    'address' => ['nullable', 'string', 'max:500'],
                    'family_card_number' => ['nullable', 'string', 'max:32'],
                    'bpjs_kesehatan_number' => ['nullable', 'string', 'max:32'],
                    'bpjs_ketenagakerjaan_number' => ['nullable', 'string', 'max:32'],
                    'sim_a_number' => ['nullable', 'string', 'max:32'],
                    'sim_b_number' => ['nullable', 'string', 'max:32'],
                    'sim_c_number' => ['nullable', 'string', 'max:32'],
                    'biological_mother_name' => ['nullable', 'string', 'max:100'],
                    'emergency_contact_name' => ['nullable', 'string', 'max:100'],
                    'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
                    'notes' => ['nullable', 'string', 'max:1000'],
                    'is_active' => ['required', 'boolean'],
                ]);

                if ($divisionCode !== '' && $division === null) {
                    $validator->after(function ($validator) use ($divisionCode): void {
                        $validator->errors()->add('division_id', 'Kode divisi '.$divisionCode.' tidak ditemukan.');
                    });
                }

                if ($positionCode !== '' && $position === null) {
                    $validator->after(function ($validator) use ($positionCode): void {
                        $validator->errors()->add('position_id', 'Kode jabatan '.$positionCode.' tidak ditemukan.');
                    });
                }

                if ($managerCode !== '' && $managerId === null) {
                    $validator->after(function ($validator) use ($managerCode): void {
                        $validator->errors()->add('manager_id', 'Kode manager '.$managerCode.' tidak ditemukan.');
                    });
                }

                if ($validator->fails()) {
                    throw ValidationException::withMessages([
                        'import_file' => [
                            'Baris '.$rowNumber.': '.implode(' ', $validator->errors()->all()),
                        ],
                    ]);
                }

                $this->ensurePositionMatchesDivision($payload['position_id'], $payload['division_id']);

                $division = Division::query()->lockForUpdate()->findOrFail($payload['division_id']);
                $position = Position::query()->lockForUpdate()->findOrFail($payload['position_id']);

                Employee::create([
                    ...$payload,
                    'employee_code' => $this->generateEmployeeCode(
                        $division,
                        $position,
                        (string) $payload['hire_date'],
                    ),
                ]);
            }
        });

        return back()->with('success', count($rows).' data karyawan berhasil diimpor.');
    }

    /**
     * Generate employee contract draft document.
     */
    public function contract(Employee $employee): HttpResponse
    {
        $employee->loadMissing(['division:id,name', 'position:id,name']);

        $companySetting = CompanySetting::query()->firstOrCreate(
            ['user_id' => request()->user()->accountOwnerId()],
            [
                'name' => 'Perusahaan',
                'details' => null,
                'employee_code_prefix' => 'EMP',
                'employee_code_digits' => 4,
                'employee_code_next_number' => 1,
            ],
        );

        $hireDate = $employee->hire_date instanceof CarbonImmutable
            ? $employee->hire_date
            : CarbonImmutable::parse($employee->hire_date);

        $documentTitle = 'Kontrak_'.$employee->employee_code.'.pdf';
        $contractNumber = sprintf(
            'SPK/%s/%s',
            $employee->employee_code,
            $hireDate->format('m/y'),
        );

        return Pdf::loadView('hris.contracts.employee-contract', [
            'documentTitle' => $documentTitle,
            'companyName' => $companySetting->name,
            'companyDetails' => $companySetting->details ?: '-',
            'employee' => $employee,
            'contractNumber' => $contractNumber,
            'contractDateText' => $hireDate->locale('id')->translatedFormat('d F Y'),
            'hireDateText' => $hireDate->locale('id')->translatedFormat('d F Y'),
            'employmentTypeLabel' => match ($employee->employment_type) {
                'contract' => 'Kontrak',
                'internship' => 'Magang',
                'freelance' => 'Freelance',
                default => 'Tetap',
            },
            'baseSalaryText' => $employee->base_salary !== null
                ? 'Rp '.number_format((float) $employee->base_salary, 0, ',', '.')
                : '-',
        ])
            ->setPaper('a4')
            ->download($documentTitle);
    }

    /**
     * Store a newly created employee in storage.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);
        unset($validated['employee_code']);

        try {
            $employee = DB::transaction(function () use ($request, $validated): Employee {
                $division = Division::query()
                    ->lockForUpdate()
                    ->findOrFail($validated['division_id']);

                $position = Position::query()
                    ->lockForUpdate()
                    ->findOrFail($validated['position_id']);

                $employeeCode = $this->generateEmployeeCode(
                    $division,
                    $position,
                    (string) $validated['hire_date'],
                );

                return Employee::create([
                    ...$validated,
                    'employee_code' => $employeeCode,
                    'is_active' => $request->boolean('is_active', true),
                ]);
            });

        } catch (Throwable $exception) {
            return back()
                ->withInput()
                ->withErrors([
                    'form' => $this->resolveEmployeeSaveErrorMessage($exception),
                ]);
        }

        return back();
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);

        try {
            $employee = DB::transaction(function () use ($employee, $request, $validated): Employee {
                $employeeCode = $employee->employee_code;

                $shouldRegenerateCode =
                    (int) $employee->division_id !== (int) $validated['division_id']
                    || (int) $employee->position_id !== (int) $validated['position_id']
                    || $employee->hire_date?->format('Y-m-d') !== $validated['hire_date'];

                if ($shouldRegenerateCode) {
                    $division = Division::query()
                        ->lockForUpdate()
                        ->findOrFail($validated['division_id']);

                    $position = Position::query()
                        ->lockForUpdate()
                        ->findOrFail($validated['position_id']);

                    $employeeCode = $this->generateEmployeeCode(
                        $division,
                        $position,
                        (string) $validated['hire_date'],
                        $employee->id,
                    );
                }

                $employee->update([
                    ...$validated,
                    'employee_code' => $employeeCode,
                    'is_active' => $request->boolean('is_active', true),
                ]);

                return $employee->fresh();
            });

        } catch (Throwable $exception) {
            return back()
                ->withInput()
                ->withErrors([
                    'form' => $this->resolveEmployeeSaveErrorMessage($exception),
                ]);
        }

        return back();
    }

    public function activatePortalUser(Employee $employee, UserPortalAccountService $portalAccountService): RedirectResponse
    {
        if (! $employee->email || ! $employee->phone) {
            return back()->with('error', 'Aktivasi gagal: email dan nomor HP karyawan wajib diisi.');
        }

        try {
            $portalUser = $portalAccountService->activateFromEmployee($employee);

            if (! $portalUser) {
                return back()->with('error', 'Aktivasi gagal: data kontak karyawan tidak valid.');
            }
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Aktivasi gagal: tidak dapat mengirim kredensial ke WhatsApp.');
        }

        return back()->with('success', 'Akun portal berhasil diaktivasi dan kredensial dikirim ke WhatsApp.');
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
     * Generate employee code based on position, division sequence, and hire date.
     */
    private function generateEmployeeCode(
        Division $division,
        Position $position,
        string $hireDate,
        ?int $ignoreEmployeeId = null,
    ): string {
        $hireDateValue = CarbonImmutable::parse($hireDate);
        $sequence = Employee::query()
            ->where('division_id', $division->id)
            ->when($ignoreEmployeeId !== null, fn ($query) => $query->whereKeyNot($ignoreEmployeeId))
            ->count() + 1;

        $candidate = strtoupper($position->code)
            .str_pad((string) $sequence, 3, '0', STR_PAD_LEFT)
            .$hireDateValue->format('my');

        $exists = Employee::query()
            ->when($ignoreEmployeeId !== null, fn ($query) => $query->whereKeyNot($ignoreEmployeeId))
            ->where('employee_code', $candidate)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'employee_code' => 'Kode karyawan otomatis bentrok. Silakan simpan ulang data karyawan.',
            ]);
        }

        return $candidate;
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

    private function resolveEmployeeSaveErrorMessage(Throwable $exception): string
    {
        if ($exception instanceof QueryException) {
            $message = $exception->getMessage();

            if (str_contains($message, 'UNIQUE constraint failed')) {
                if (str_contains($message, 'employees.email')) {
                    return 'Gagal menyimpan: email karyawan sudah dipakai pada akun ini.';
                }

                if (str_contains($message, 'employees.employee_code')) {
                    return 'Gagal menyimpan: kode karyawan bentrok, silakan pilih kombinasi divisi/jabatan/tanggal masuk yang berbeda.';
                }

                if (str_contains($message, 'users.email')) {
                    return 'Gagal membuat akun portal: email sudah digunakan akun lain.';
                }

                if (str_contains($message, 'users.phone')) {
                    return 'Gagal membuat akun portal: nomor HP sudah digunakan akun lain.';
                }

                return 'Gagal menyimpan: ada data duplikat pada kolom yang harus unik.';
            }

            if (str_contains($message, 'FOREIGN KEY constraint failed')) {
                return 'Gagal menyimpan: data relasi (divisi, jabatan, atau atasan) tidak valid.';
            }

            return 'Gagal menyimpan ke database: '.$message;
        }

        return 'Gagal menyimpan data karyawan: '.$exception->getMessage();
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function parseImportRows(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, false, false, false);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'import_file' => 'File import tidak dapat dibaca.',
            ]);
        }

        $headerRow = array_shift($rows);

        if (! is_array($headerRow)) {
            throw ValidationException::withMessages([
                'import_file' => 'Header file import tidak valid.',
            ]);
        }

        $header = array_map(function ($value, $index) {
            $value = (string) $value;

            if ($index === 0) {
                $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
            }

            return Str::of($value)->trim()->lower()->toString();
        }, $headerRow, array_keys($headerRow));

        $lineNumber = 1;
        $parsedRows = [];

        foreach ($rows as $data) {
            $lineNumber++;

            if ($data === [null] || count(array_filter($data, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $parsedRows[$lineNumber] = array_combine(
                $header,
                array_pad($data, count($header), null)
            ) ?: [];
        }

        $spreadsheet->disconnectWorksheets();

        return $parsedRows;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function nullableInteger(mixed $value): ?int
    {
        $normalized = $this->nullableString($value);

        if ($normalized === null) {
            return null;
        }

        return (int) $normalized;
    }

    private function normalizeImportedAmount(mixed $value): ?string
    {
        $normalized = $this->nullableString($value);

        if ($normalized === null) {
            return null;
        }

        $digits = preg_replace('/[^\d]/', '', $normalized);

        return $digits === '' ? null : $digits;
    }

    private function normalizeImportedBoolean(mixed $value): bool
    {
        $normalized = strtolower($this->nullableString($value) ?? '1');

        return in_array($normalized, ['1', 'true', 'yes', 'ya', 'aktif'], true);
    }
}
