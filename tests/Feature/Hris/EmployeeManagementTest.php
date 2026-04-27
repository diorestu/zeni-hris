<?php

namespace Tests\Feature\Hris;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeBankAccount;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_visit_employee_management_page()
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('hris.employees.index'));

        $response->assertOk();
    }

    public function test_employee_code_is_generated_from_position_division_sequence_and_hire_date()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'HR',
        ]);
        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'code' => 'CL',
            'level' => '3',
        ]);

        $response = $this->actingAs($user)->post(route('hris.employees.store'), [
            'full_name' => 'Dio Manuaba',
            'email' => 'dio@example.com',
            'phone' => '08123456789',
            'gender' => 'male',
            'birth_date' => '1998-05-20',
            'hire_date' => '2026-03-01',
            'employment_status' => 'active',
            'employment_type' => 'permanent',
            'pph21_method' => 'gross',
            'pph21_rate' => '5',
            'division_id' => $division->id,
            'position_id' => $position->id,
            'base_salary' => '5.000.000',
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('employees', [
            'employee_code' => 'CL0010326',
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'base_salary' => '5000000.00',
            'pph21_method' => 'gross',
            'pph21_rate' => '5.00',
        ]);

        $portalUser = User::query()
            ->where('parent_user_id', $user->id)
            ->where('email', 'dio@example.com')
            ->first();

        $this->assertNull($portalUser);
    }

    public function test_admin_can_activate_portal_user_for_employee(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'HR',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'code' => 'CL',
            'level' => '3',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'first_name' => 'Dio Manuaba',
            'email' => 'dio@example.com',
            'phone' => '08123456789',
        ]);

        $response = $this->actingAs($user)
            ->post(route('hris.employees.activate-user', $employee));

        $response->assertRedirect();

        $portalUser = User::query()
            ->where('parent_user_id', $user->id)
            ->where('email', 'dio@example.com')
            ->first();

        $this->assertNotNull($portalUser);
        $this->assertSame('user', $portalUser->role);
        $this->assertTrue($portalUser->requires_password_change);
        $this->assertTrue(Hash::check('628123456789', $portalUser->password));
    }

    public function test_division_cannot_be_deleted_when_it_has_related_data()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
        ]);
        Employee::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
        ]);

        $response = $this->actingAs($user)
            ->from(route('hris.employees.index'))
            ->delete(route('hris.divisions.destroy', $division));

        $response->assertRedirect(route('hris.employees.index'));
        $response->assertSessionHasErrors(['division_delete']);
    }

    public function test_primary_bank_account_switching_and_fallback_work_correctly()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $first = EmployeeBankAccount::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'is_primary' => true,
        ]);

        $second = EmployeeBankAccount::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'is_primary' => false,
        ]);

        $this->actingAs($user)->put(
            route('hris.employees.bank-accounts.update', [
                'employee' => $employee,
                'employeeBankAccount' => $second,
            ]),
            [
                'bank_name' => $second->bank_name,
                'account_number' => $second->account_number,
                'account_holder_name' => $second->account_holder_name,
                'branch' => $second->branch,
                'currency' => $second->currency,
                'is_primary' => true,
            ]
        )->assertRedirect();

        $this->assertDatabaseHas('employee_bank_accounts', [
            'id' => $first->id,
            'is_primary' => false,
        ]);

        $this->assertDatabaseHas('employee_bank_accounts', [
            'id' => $second->id,
            'is_primary' => true,
        ]);

        $this->actingAs($user)->delete(route('hris.employees.bank-accounts.destroy', [
            'employee' => $employee,
            'employeeBankAccount' => $second,
        ]))->assertRedirect();

        $this->assertDatabaseMissing('employee_bank_accounts', [
            'id' => $second->id,
        ]);

        $this->assertDatabaseHas('employee_bank_accounts', [
            'id' => $first->id,
            'is_primary' => true,
        ]);
    }

    public function test_employee_allowance_can_be_deleted()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $allowance = EmployeeAllowance::create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Transport',
            'amount' => 250000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->delete(route('hris.employees.allowances.destroy', [
            'employee' => $employee,
            'employeeAllowance' => $allowance,
        ]));

        $response->assertRedirect();

        $this->assertDatabaseMissing('employee_allowances', [
            'id' => $allowance->id,
        ]);
    }

    public function test_employee_allowance_accepts_masked_amount_input()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('hris.employees.allowances.store', [
            'employee' => $employee,
        ]), [
            'name' => 'Makan',
            'amount' => '1.250.000',
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('employee_allowances', [
            'employee_id' => $employee->id,
            'name' => 'Makan',
            'amount' => '1250000.00',
        ]);
    }

    public function test_level_zero_to_two_position_can_only_be_assigned_to_one_employee()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
        ]);
        $position = Position::factory()->create([
            'division_id' => $division->id,
            'user_id' => $user->id,
            'level' => '2',
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'position_id' => $position->id,
            'division_id' => $division->id,
        ]);

        $response = $this->actingAs($user)
            ->from(route('hris.employees.index'))
            ->post(route('hris.employees.store'), [
                'full_name' => 'Budi',
                'hire_date' => '2026-03-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'pph21_method' => 'gross',
                'pph21_rate' => '5',
                'division_id' => $division->id,
                'position_id' => $position->id,
                'is_active' => true,
            ]);

        $response->assertRedirect(route('hris.employees.index'));
        $response->assertSessionHasErrors(['position_id']);
    }

    public function test_level_three_to_five_position_can_be_assigned_to_multiple_employees()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'OPS',
        ]);

        $position = Position::factory()->create([
            'division_id' => $division->id,
            'user_id' => $user->id,
            'code' => 'OP',
            'level' => '5',
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'position_id' => $position->id,
            'division_id' => $division->id,
        ]);

        $response = $this->actingAs($user)
            ->post(route('hris.employees.store'), [
                'full_name' => 'Andi',
                'hire_date' => '2026-03-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'pph21_method' => 'gross',
                'pph21_rate' => '5',
                'division_id' => $division->id,
                'position_id' => $position->id,
                'is_active' => true,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseCount('employees', 2);
        $this->assertDatabaseHas('employees', [
            'user_id' => $user->id,
            'position_id' => $position->id,
            'first_name' => 'Andi',
        ]);
    }

    public function test_sub_position_can_be_created_under_parent_position()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
        ]);
        $parent = Position::factory()->create([
            'division_id' => $division->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('hris.positions.store'), [
            'division_id' => $division->id,
            'parent_position_id' => $parent->id,
            'code' => 'S01',
            'name' => 'Senior '.fake()->jobTitle(),
            'level' => '5',
            'description' => 'Sub posisi untuk pengujian.',
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('positions', [
            'parent_position_id' => $parent->id,
            'division_id' => $division->id,
            'code' => 'S01',
        ]);
    }

    public function test_employee_contract_can_be_downloaded()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'name' => 'Human Resource',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'name' => 'Crew Leader',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'employee_code' => 'CL0010326',
            'first_name' => 'Dio',
            'last_name' => 'Manuaba',
            'hire_date' => '2026-03-01',
        ]);

        $response = $this->actingAs($user)->get(
            route('hris.employees.contract', $employee)
        );

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_employee_import_template_can_be_downloaded(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('hris.employees.import-template'));

        $response->assertOk();
        $response->assertDownload('employee_import_template.xlsx');
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_admin_can_import_employees_from_xlsx(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'HR',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'code' => 'STF',
            'level' => '4',
        ]);

        $file = $this->buildEmployeeImportFile([
            [
                'full_name' => 'Dio Manuaba',
                'email' => 'dio@example.com',
                'phone' => '08123456789',
                'gender' => 'male',
                'birth_date' => '1998-05-20',
                'last_education' => 'S1',
                'marital_status' => 'single',
                'children_count' => '0',
                'hire_date' => '2026-03-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'pph21_method' => 'gross',
                'pph21_rate' => '5',
                'division_code' => 'HR',
                'position_code' => 'STF',
                'manager_employee_code' => '',
                'base_salary' => '5000000',
                'address' => 'Jalan Mawar',
                'family_card_number' => '',
                'bpjs_kesehatan_number' => '',
                'bpjs_ketenagakerjaan_number' => '',
                'sim_a_number' => '',
                'sim_b_number' => '',
                'sim_c_number' => '',
                'biological_mother_name' => 'Ni Made Sari',
                'emergency_contact_name' => 'Rina',
                'emergency_contact_phone' => '0811111111',
                'notes' => 'Import test',
                'is_active' => '1',
            ],
        ]);

        $response = $this->actingAs($user)->post(route('hris.employees.import'), [
            'import_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('employees', [
            'user_id' => $user->id,
            'first_name' => 'Dio Manuaba',
            'last_name' => null,
            'email' => 'dio@example.com',
            'division_id' => $division->id,
            'position_id' => $position->id,
            'base_salary' => '5000000.00',
        ]);
    }

    public function test_employee_import_fails_when_division_code_is_unknown(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'HR',
        ]);

        Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'code' => 'STF',
            'level' => '4',
        ]);

        $file = $this->buildEmployeeImportFile([
            [
                'full_name' => 'Dio Manuaba',
                'email' => 'dio@example.com',
                'phone' => '08123456789',
                'gender' => 'male',
                'birth_date' => '1998-05-20',
                'last_education' => 'S1',
                'marital_status' => 'single',
                'children_count' => '0',
                'hire_date' => '2026-03-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'pph21_method' => 'gross',
                'pph21_rate' => '5',
                'division_code' => 'XXX',
                'position_code' => 'STF',
                'manager_employee_code' => '',
                'base_salary' => '5000000',
                'address' => 'Jalan Mawar',
                'family_card_number' => '',
                'bpjs_kesehatan_number' => '',
                'bpjs_ketenagakerjaan_number' => '',
                'sim_a_number' => '',
                'sim_b_number' => '',
                'sim_c_number' => '',
                'biological_mother_name' => 'Ni Made Sari',
                'emergency_contact_name' => 'Rina',
                'emergency_contact_phone' => '0811111111',
                'notes' => 'Import test',
                'is_active' => '1',
            ],
        ]);

        $response = $this->actingAs($user)
            ->from(route('hris.employees.index'))
            ->post(route('hris.employees.import'), [
                'import_file' => $file,
            ]);

        $response->assertRedirect(route('hris.employees.index'));
        $response->assertSessionHasErrors(['import_file']);
        $this->assertDatabaseCount('employees', 0);
    }

    public function test_two_companies_can_store_same_division_code_and_name(): void
    {
        $firstUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($firstUser)->post(route('hris.divisions.store'), [
            'code' => 'HR',
            'name' => 'Human Resource',
            'is_active' => true,
        ])->assertRedirect();

        $this->actingAs($secondUser)->post(route('hris.divisions.store'), [
            'code' => 'HR',
            'name' => 'Human Resource',
            'is_active' => true,
        ])->assertRedirect();

        $this->assertDatabaseCount('divisions', 2);
        $this->assertDatabaseHas('divisions', [
            'user_id' => $firstUser->id,
            'code' => 'HR',
            'name' => 'Human Resource',
        ]);
        $this->assertDatabaseHas('divisions', [
            'user_id' => $secondUser->id,
            'code' => 'HR',
            'name' => 'Human Resource',
        ]);
    }

    public function test_two_companies_can_store_same_position_code(): void
    {
        $firstUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $firstDivision = Division::factory()->create([
            'user_id' => $firstUser->id,
        ]);

        $secondDivision = Division::factory()->create([
            'user_id' => $secondUser->id,
        ]);

        $this->actingAs($firstUser)->post(route('hris.positions.store'), [
            'division_id' => $firstDivision->id,
            'code' => 'MGR',
            'name' => 'Manager',
            'level' => '2',
            'is_active' => true,
        ])->assertRedirect();

        $this->actingAs($secondUser)->post(route('hris.positions.store'), [
            'division_id' => $secondDivision->id,
            'code' => 'MGR',
            'name' => 'Manager',
            'level' => '2',
            'is_active' => true,
        ])->assertRedirect();

        $this->assertDatabaseCount('positions', 2);
        $this->assertDatabaseHas('positions', [
            'user_id' => $firstUser->id,
            'code' => 'MGR',
        ]);
        $this->assertDatabaseHas('positions', [
            'user_id' => $secondUser->id,
            'code' => 'MGR',
        ]);
    }

    public function test_two_companies_can_store_same_employee_email_and_generated_code(): void
    {
        $firstUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $firstDivision = Division::factory()->create([
            'user_id' => $firstUser->id,
            'code' => 'OPS',
        ]);

        $secondDivision = Division::factory()->create([
            'user_id' => $secondUser->id,
            'code' => 'OPS',
        ]);

        $firstPosition = Position::factory()->create([
            'user_id' => $firstUser->id,
            'division_id' => $firstDivision->id,
            'code' => 'STF',
            'level' => '4',
        ]);

        $secondPosition = Position::factory()->create([
            'user_id' => $secondUser->id,
            'division_id' => $secondDivision->id,
            'code' => 'STF',
            'level' => '4',
        ]);

        $payload = [
            'full_name' => 'Ayu Lestari',
            'email' => 'ayu@example.com',
            'hire_date' => '2026-03-01',
            'employment_status' => 'active',
            'employment_type' => 'permanent',
            'pph21_method' => 'gross',
            'pph21_rate' => '5',
            'base_salary' => '5.000.000',
            'is_active' => true,
        ];

        $this->actingAs($firstUser)->post(route('hris.employees.store'), [
            ...$payload,
            'division_id' => $firstDivision->id,
            'position_id' => $firstPosition->id,
        ])->assertRedirect();

        $this->actingAs($secondUser)->post(route('hris.employees.store'), [
            ...$payload,
            'division_id' => $secondDivision->id,
            'position_id' => $secondPosition->id,
        ])->assertRedirect();

        $this->assertDatabaseCount('employees', 2);
        $this->assertDatabaseHas('employees', [
            'user_id' => $firstUser->id,
            'email' => 'ayu@example.com',
            'employee_code' => 'STF0010326',
        ]);
        $this->assertDatabaseHas('employees', [
            'user_id' => $secondUser->id,
            'email' => 'ayu@example.com',
            'employee_code' => 'STF0010326',
        ]);
    }

    public function test_employee_requires_valid_pph21_method_and_rate(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'code' => 'HR',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'code' => 'STF',
            'level' => '4',
        ]);

        $response = $this->actingAs($user)
            ->from(route('hris.employees.index'))
            ->post(route('hris.employees.store'), [
                'full_name' => 'Karyawan Tes',
                'hire_date' => '2026-03-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'division_id' => $division->id,
                'position_id' => $position->id,
                'pph21_method' => 'invalid_method',
                'pph21_rate' => '150',
                'is_active' => true,
            ]);

        $response->assertRedirect(route('hris.employees.index'));
        $response->assertSessionHasErrors(['pph21_method', 'pph21_rate']);
    }

    /**
     * @param  array<int, array<string, string>>  $rows
     */
    private function buildEmployeeImportFile(array $rows): UploadedFile
    {
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

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($headers as $index => $header) {
            $sheet->setCellValue(Coordinate::stringFromColumnIndex($index + 1).'1', $header);
        }

        foreach ($rows as $rowIndex => $row) {
            foreach ($headers as $columnIndex => $header) {
                $sheet->setCellValue(
                    Coordinate::stringFromColumnIndex($columnIndex + 1).($rowIndex + 2),
                    $row[$header] ?? ''
                );
            }
        }

        $path = tempnam(sys_get_temp_dir(), 'employee-import');
        $writer = new Xlsx($spreadsheet);
        $writer->save($path);
        $spreadsheet->disconnectWorksheets();

        return new UploadedFile(
            $path,
            'employees.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }
}
