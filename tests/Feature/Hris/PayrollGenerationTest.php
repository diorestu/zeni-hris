<?php

namespace Tests\Feature\Hris;

use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeDeduction;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_open_payroll_page()
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)->get(route('hris.payrolls.index'))->assertOk();
    }

    public function test_payroll_can_be_auto_generated_from_salary_allowances_and_deductions()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'base_salary' => 5_000_000,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        EmployeeAllowance::query()->create([
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Transport',
            'amount' => 500_000,
            'is_active' => true,
            'effective_start_date' => '2026-02-01',
            'effective_end_date' => null,
        ]);

        EmployeeAllowance::query()->create([
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Makan',
            'amount' => 300_000,
            'is_active' => true,
            'effective_start_date' => '2026-01-01',
            'effective_end_date' => null,
        ]);

        EmployeeDeduction::query()->create([
            'employee_id' => $employee->id,
            'type' => 'kasbon',
            'amount' => 250_000,
            'deduction_date' => '2026-02-10',
        ]);

        EmployeeDeduction::query()->create([
            'employee_id' => $employee->id,
            'type' => 'denda',
            'amount' => 50_000,
            'deduction_date' => '2026-02-15',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseHas('payroll_runs', [
            'period' => '2026-02',
            'employees_count' => 1,
            'total_base_salary' => 5000000.00,
            'total_allowances' => 800000.00,
            'total_deductions' => 300000.00,
            'total_net_salary' => 5500000.00,
        ]);

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'base_salary' => 5000000.00,
            'allowances_total' => 800000.00,
            'kasbon_deduction' => 250000.00,
            'denda_deduction' => 50000.00,
            'deductions_total' => 300000.00,
            'net_salary' => 5500000.00,
        ]);
    }

    public function test_generated_payroll_can_be_saved()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $run = PayrollRun::factory()->create([
            'period' => '2026-02',
            'is_saved' => false,
            'saved_at' => null,
            'saved_by' => null,
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.save', $run))
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'is_saved' => true,
            'saved_by' => $user->id,
        ]);
    }
}
