<?php

namespace Tests\Feature\Hris;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeBankAccount;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_employee_can_be_created_with_division_and_position()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create();
        $position = Position::factory()->create([
            'division_id' => $division->id,
        ]);

        $response = $this->actingAs($user)->post(route('hris.employees.store'), [
            'employee_code' => 'EMP-1001',
            'first_name' => 'Dio',
            'last_name' => 'Manuaba',
            'email' => 'dio@example.com',
            'phone' => '08123456789',
            'gender' => 'male',
            'birth_date' => '1998-05-20',
            'hire_date' => '2024-01-01',
            'employment_status' => 'active',
            'employment_type' => 'permanent',
            'division_id' => $division->id,
            'position_id' => $position->id,
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-1001',
            'division_id' => $division->id,
            'position_id' => $position->id,
        ]);
    }

    public function test_division_cannot_be_deleted_when_it_has_related_data()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create();
        Employee::factory()->create([
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

        $employee = Employee::factory()->create();

        $first = EmployeeBankAccount::factory()->create([
            'employee_id' => $employee->id,
            'is_primary' => true,
        ]);

        $second = EmployeeBankAccount::factory()->create([
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

    public function test_position_can_only_be_assigned_to_one_employee()
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
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'position_id' => $position->id,
            'division_id' => $division->id,
        ]);

        $response = $this->actingAs($user)
            ->from(route('hris.employees.index'))
            ->post(route('hris.employees.store'), [
                'employee_code' => 'EMP-3001',
                'first_name' => 'Budi',
                'hire_date' => '2024-01-01',
                'employment_status' => 'active',
                'employment_type' => 'permanent',
                'division_id' => $division->id,
                'position_id' => $position->id,
                'is_active' => true,
            ]);

        $response->assertRedirect(route('hris.employees.index'));
        $response->assertSessionHasErrors(['position_id']);
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
            'code' => 'POS-SUB1',
            'name' => 'Senior '.fake()->jobTitle(),
            'level' => '3',
            'description' => 'Sub posisi untuk pengujian.',
            'is_active' => true,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('positions', [
            'parent_position_id' => $parent->id,
            'division_id' => $division->id,
            'code' => 'POS-SUB1',
        ]);
    }
}
