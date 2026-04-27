<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeDeduction;
use App\Models\PayrollRun;
use App\Models\PayrollItem;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KonsulinPayrollSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create the account owner
        $owner = User::firstOrCreate(
            ['email' => 'admin@konsulin.id'],
            [
                'name' => 'Konsulin Admin',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create or find Division
        $division = Division::updateOrCreate(
            ['code' => 'KONSULIN'],
            [
                'user_id' => $owner->id,
                'name' => 'Konsulin.ID',
                'description' => 'Finance & Tax Consulting',
                'is_active' => true,
            ]
        );

        // Define positions
        $positions = $this->createPositions($owner->id, $division->id);

        // Employee data from CSV
        $employeeData = [
            [
                'name' => 'Anisha Taniawati',
                'nik' => '3273125506930000',
                'position_key' => 'manager',
                'ptkp' => 'TK/0',
                'base_salary' => 12000000,
                'tunjangan_jabatan' => 1000000,
                'tunjangan_kinerja' => 1000000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 893616,
                'pph21_deduction' => 893616,
                'pinjaman_staff' => 0,
                'gross_salary' => 14893616,
                'net_salary' => 14000000,
            ],
            [
                'name' => 'Dio Restu Saputra',
                'nik' => '5171040909960000',
                'position_key' => 'it_head',
                'ptkp' => 'K/1',
                'base_salary' => 6500000,
                'tunjangan_jabatan' => 500000,
                'tunjangan_kinerja' => 300000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 73737,
                'pph21_deduction' => 73737,
                'pinjaman_staff' => 0,
                'gross_salary' => 7373737,
                'net_salary' => 7300000,
            ],
            [
                'name' => 'Firdha Chairiyah',
                'nik' => '3671116910960000',
                'position_key' => 'senior_staff',
                'ptkp' => 'TK/0',
                'base_salary' => 7500000,
                'tunjangan_jabatan' => 500000,
                'tunjangan_kinerja' => 500000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 151399,
                'pph21_deduction' => 151399,
                'pinjaman_staff' => 0,
                'gross_salary' => 8651399,
                'net_salary' => 8500000,
            ],
            [
                'name' => 'Ni Putu Sintya Bhakti Pratiwi',
                'nik' => '5102056501940000',
                'position_key' => 'staff',
                'ptkp' => 'TK/0',
                'base_salary' => 5000000,
                'tunjangan_jabatan' => 500000,
                'tunjangan_kinerja' => 500000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 45340,
                'pph21_deduction' => 45340,
                'pinjaman_staff' => 0,
                'gross_salary' => 6045340,
                'net_salary' => 6000000,
            ],
            [
                'name' => 'Choirun Nisa Khurota Ayunin Masruroh',
                'nik' => '3515174312020000',
                'position_key' => 'staff',
                'ptkp' => 'TK/1',
                'base_salary' => 4000000,
                'tunjangan_jabatan' => 500000,
                'tunjangan_kinerja' => 500000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 0,
                'pph21_deduction' => 0,
                'pinjaman_staff' => 0,
                'gross_salary' => 5000000,
                'net_salary' => 5000000,
            ],
            [
                'name' => 'Annisa Widyastuti',
                'nik' => '3329084901020000',
                'position_key' => 'staff',
                'ptkp' => 'TK/0',
                'base_salary' => 4500000,
                'tunjangan_jabatan' => 500000,
                'tunjangan_kinerja' => 500000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 13784,
                'pph21_deduction' => 13784,
                'pinjaman_staff' => 3000000,
                'gross_salary' => 5513784,
                'net_salary' => 2500000,
            ],
            [
                'name' => 'Adi Putra Rizkillah',
                'nik' => '3603233001010000',
                'position_key' => 'director',
                'ptkp' => 'TK/0',
                'base_salary' => 8000000,
                'tunjangan_jabatan' => 1000000,
                'tunjangan_kinerja' => 1000000,
                'bpjs_kesehatan' => 0,
                'bpjs_tk' => 0,
                'tunjangan_pph21' => 230179,
                'pph21_deduction' => 230179,
                'pinjaman_staff' => 0,
                'gross_salary' => 10230179,
                'net_salary' => 10000000,
            ],
        ];

        // Create employees and related data
        $employees = [];
        foreach ($employeeData as $data) {
            $nameParts = explode(' ', trim($data['name']), 2);
            $firstName = $nameParts[0];
            $lastName = $nameParts[1] ?? null;
            $email = $this->generateEmail($data['name']);

            $employee = Employee::updateOrCreate(
                [
                    'user_id' => $owner->id,
                    'email' => $email,
                ],
                [
                    'employee_code' => $this->generateEmployeeCode($data['name']),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => null,
                    'gender' => null,
                    'birth_date' => null,
                    'last_education' => null,
                    'marital_status' => null,
                    'children_count' => null,
                    'hire_date' => now()->startOfYear(),
                    'employment_status' => 'active',
                    'employment_type' => 'permanent',
                    'pph21_method' => 'gross',
                    'pph21_rate' => 0,
                    'ptkp_category' => $data['ptkp'] ?? null,
                    'division_id' => $division->id,
                    'position_id' => $positions[$data['position_key']]->id,
                    'manager_id' => null,
                    'base_salary' => $data['base_salary'],
                    'address' => null,
                    'family_card_number' => null,
                    'bpjs_kesehatan_number' => null,
                    'bpjs_ketenagakerjaan_number' => null,
                    'sim_a_number' => null,
                    'sim_b_number' => null,
                    'sim_c_number' => null,
                    'biological_mother_name' => null,
                    'emergency_contact_name' => null,
                    'emergency_contact_phone' => null,
                    'notes' => 'Imported from Konsulin payroll data',
                    'is_active' => true,
                ]
            );

            // Create allowances
            if ($data['tunjangan_jabatan'] > 0) {
                EmployeeAllowance::create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'name' => 'Tunjangan Jabatan',
                    'amount' => $data['tunjangan_jabatan'],
                    'is_active' => true,
                    'effective_start_date' => now()->startOfMonth(),
                    'effective_end_date' => null,
                    'notes' => null,
                ]);
            }

            if ($data['tunjangan_kinerja'] > 0) {
                EmployeeAllowance::create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'name' => 'Tunjangan Kinerja',
                    'amount' => $data['tunjangan_kinerja'],
                    'is_active' => true,
                    'effective_start_date' => now()->startOfMonth(),
                    'effective_end_date' => null,
                    'notes' => null,
                ]);
            }

            if ($data['tunjangan_pph21'] > 0) {
                EmployeeAllowance::create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'name' => 'Tunjangan PPh 21',
                    'amount' => $data['tunjangan_pph21'],
                    'is_active' => true,
                    'effective_start_date' => now()->startOfMonth(),
                    'effective_end_date' => null,
                    'notes' => null,
                ]);
            }

            // Create deductions
            if ($data['pinjaman_staff'] > 0) {
                EmployeeDeduction::create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'type' => 'kasbon',
                    'amount' => $data['pinjaman_staff'],
                    'deduction_date' => now()->startOfMonth(),
                    'notes' => 'Pinjaman Karyawan',
                ]);
            }

            $employees[$data['name']] = [
                'employee' => $employee,
                'data' => $data,
            ];
        }

        // Calculate total allowances and deductions
        $totalAllowances = 0;
        $totalDeductions = 0;
        $totalNetSalary = 0;

        foreach ($employees as $item) {
            $employee = $item['employee'];
            $data = $item['data'];

            $itemAllowances = (float) (($data['tunjangan_jabatan'] ?? 0) +
                                       ($data['tunjangan_kinerja'] ?? 0) +
                                       ($data['tunjangan_pph21'] ?? 0));

            $kasbonDeduction = round((float) EmployeeDeduction::where('employee_id', $employee->id)
                ->where('type', 'kasbon')
                ->sum('amount'), 2);

            $dendaDeduction = round((float) EmployeeDeduction::where('employee_id', $employee->id)
                ->where('type', 'denda')
                ->sum('amount'), 2);

            // Get PTKP value from config
            $ptkpConfig = config('ptkp.categories');
            $ptkpCategory = (string) ($employee->ptkp_category ?? 'TK/0');
            $ptkpMonthly = (float) ($ptkpConfig[$ptkpCategory]['monthly'] ?? 0);

            $taxableGross = (float) $data['base_salary'] + $itemAllowances;
            $taxableIncome = max($taxableGross - $ptkpMonthly, 0);
            $pph21Rate = (float) ($employee->pph21_rate ?? 0) / 100;
            $pph21Deduction = floor($taxableIncome * $pph21Rate * 100) / 100;

            $itemDeductions = round($pph21Deduction + $kasbonDeduction + $dendaDeduction, 2);
            $itemNetSalary = round(max(($data['base_salary'] + $itemAllowances) - $itemDeductions, 0), 2);

            $totalAllowances += $itemAllowances;
            $totalDeductions += $itemDeductions;
            $totalNetSalary += $itemNetSalary;
        }

        // Create PayrollRun with calculated totals
        $payrollRun = PayrollRun::create([
            'user_id' => $owner->id,
            'period' => '2026-04',
            'period_start' => '2026-04-01',
            'period_end' => '2026-04-30',
            'employees_count' => count($employees),
            'total_base_salary' => collect($employees)->sum('data.base_salary'),
            'total_allowances' => round($totalAllowances, 2),
            'total_deductions' => round($totalDeductions, 2),
            'total_net_salary' => round($totalNetSalary, 2),
            'generated_at' => now(),
            'generated_by' => $owner->id,
            'is_saved' => false,
            'saved_at' => null,
            'saved_by' => null,
        ]);

        // Create PayrollItems for each employee (same calculation loop again)
        foreach ($employees as $name => $item) {
            $employee = $item['employee'];
            $data = $item['data'];

            $baseSalary = (float) $data['base_salary'];
            $totalAllowances = (float) (($data['tunjangan_jabatan'] ?? 0) +
                                        ($data['tunjangan_kinerja'] ?? 0) +
                                        ($data['tunjangan_pph21'] ?? 0));

            // Calculate kasbon and denda from database deductions (not from data array)
            $kasbonDeduction = round((float) EmployeeDeduction::where('employee_id', $employee->id)
                ->where('type', 'kasbon')
                ->sum('amount'), 2);

            $dendaDeduction = round((float) EmployeeDeduction::where('employee_id', $employee->id)
                ->where('type', 'denda')
                ->sum('amount'), 2);

            // Get PTKP value from config
            $ptkpConfig = config('ptkp.categories');
            $ptkpCategory = (string) ($employee->ptkp_category ?? 'TK/0');
            $ptkpMonthly = (float) ($ptkpConfig[$ptkpCategory]['monthly'] ?? 0);

            // Calculate PPh21 with PTKP deduction
            $taxableGross = $baseSalary + $totalAllowances;
            $taxableIncome = max($taxableGross - $ptkpMonthly, 0);
            $pph21Rate = (float) ($employee->pph21_rate ?? 0) / 100;
            $pph21Method = (string) ($employee->pph21_method ?? 'gross');
            $pph21Deduction = 0;
            $pph21Allowance = 0;

            if ($pph21Method === 'gross') {
                $pph21Deduction = floor($taxableIncome * $pph21Rate * 100) / 100;
            } elseif ($pph21Method === 'gross_up') {
                // Gross-up: allowance covers the tax
                if ($pph21Rate > 0 && $pph21Rate < 1) {
                    $pph21Allowance = floor($taxableIncome * $pph21Rate / (1 - $pph21Rate) * 100) / 100;
                    $pph21Deduction = $pph21Allowance;
                }
            }

            $totalDeductions = round($pph21Deduction + $kasbonDeduction + $dendaDeduction, 2);
            $netSalary = round(max(($baseSalary + $totalAllowances) - $totalDeductions, 0), 2);

            PayrollItem::create([
                'user_id' => $owner->id,
                'payroll_run_id' => $payrollRun->id,
                'employee_id' => $employee->id,
                'base_salary' => $baseSalary,
                'allowances_total' => $totalAllowances,
                'pph21_method' => (string) ($employee->pph21_method ?? 'gross'),
                'pph21_rate' => (float) ($employee->pph21_rate ?? 0),
                'pph21_allowance' => $pph21Allowance,
                'pph21_deduction' => $pph21Deduction,
                'pph21_company_borne' => 0,
                'kasbon_deduction' => $kasbonDeduction,
                'denda_deduction' => $dendaDeduction,
                'deductions_total' => $totalDeductions,
                'net_salary' => $netSalary,
                'allowance_breakdown' => [
                    'tunjangan_jabatan' => (float) ($data['tunjangan_jabatan'] ?? 0),
                    'tunjangan_kinerja' => (float) ($data['tunjangan_kinerja'] ?? 0),
                    'tunjangan_pph21' => $pph21Allowance,
                ],
            ]);
        }

        $this->command->info('Konsulin payroll data seeded successfully!');
        $this->command->info("Total employees: " . count($employees));
        $this->command->info("Payroll Run ID: " . $payrollRun->id);
    }

    /**
     * Create positions for the division
     */
    private function createPositions(int $userId, int $divisionId): array
    {
        $positions = [
            'director' => [
                'code' => 'POS-DIR',
                'name' => 'Direktur',
                'level' => '0',
            ],
            'manager' => [
                'code' => 'POS-MGR',
                'name' => 'Manager',
                'level' => '1',
            ],
            'it_head' => [
                'code' => 'POS-ITHD',
                'name' => 'Head of IT Department',
                'level' => '1',
            ],
            'senior_staff' => [
                'code' => 'POS-SENR',
                'name' => 'Senior Staff',
                'level' => '3',
            ],
            'staff' => [
                'code' => 'POS-STAF',
                'name' => 'Staff',
                'level' => '4',
            ],
        ];

        $result = [];
        foreach ($positions as $key => $data) {
            $position = Position::updateOrCreate(
                ['code' => $data['code']],
                [
                    'user_id' => $userId,
                    'division_id' => $divisionId,
                    'name' => $data['name'],
                    'level' => $data['level'],
                    'description' => null,
                    'is_active' => true,
                ]
            );
            $result[$key] = $position;
        }

        return $result;
    }

    /**
     * Generate employee code from name
     */
    private function generateEmployeeCode(string $name): string
    {
        $initials = implode('', array_map(fn ($word) => strtoupper($word[0]), explode(' ', $name)));
        return 'EMP-' . $initials . '-' . date('Ymd');
    }

    /**
     * Generate email from name
     */
    private function generateEmail(string $name): string
    {
        $email = strtolower(Str::slug($name, '.'));
        return $email . '@konsulin.id';
    }
}
