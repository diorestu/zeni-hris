<?php

namespace Tests\Feature\Hris;

use App\Jobs\SendPayslipToWhatsApp;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeDeduction;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
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
            'user_id' => $user->id,
            'base_salary' => 5_000_000,
            'pph21_method' => 'gross',
            'pph21_rate' => 5,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Transport',
            'amount' => 500_000,
            'is_active' => true,
            'effective_start_date' => '2026-02-01',
            'effective_end_date' => null,
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Makan',
            'amount' => 300_000,
            'is_active' => true,
            'effective_start_date' => '2026-01-01',
            'effective_end_date' => null,
        ]);

        EmployeeDeduction::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'type' => 'kasbon',
            'amount' => 250_000,
            'deduction_date' => '2026-02-10',
        ]);

        EmployeeDeduction::query()->create([
            'user_id' => $user->id,
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
            'total_deductions' => 590000.00,
            'total_net_salary' => 5210000.00,
        ]);

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'base_salary' => 5000000.00,
            'allowances_total' => 800000.00,
            'pph21_method' => 'gross',
            'pph21_rate' => 5.00,
            'pph21_deduction' => 290000.00,
            'kasbon_deduction' => 250000.00,
            'denda_deduction' => 50000.00,
            'deductions_total' => 590000.00,
            'net_salary' => 5210000.00,
        ]);
    }

    public function test_pph21_gross_up_adds_tax_allowance_and_equal_tax_deduction(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'base_salary' => 4_000_000,
            'pph21_method' => 'gross_up',
            'pph21_rate' => 5,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'pph21_method' => 'gross_up',
            'pph21_allowance' => 210526.00,
            'pph21_deduction' => 210526.00,
            'net_salary' => 4000000.00,
        ]);
    }

    public function test_pph21_gross_up_matches_konsulin_dio_payroll_baseline(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'first_name' => 'Dio Restu Saputra',
            'last_name' => null,
            'base_salary' => 6_500_000,
            'pph21_method' => 'gross_up',
            'pph21_rate' => 1,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Jabatan',
            'amount' => 500_000,
            'is_active' => true,
            'effective_start_date' => '2026-04-01',
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Kinerja',
            'amount' => 300_000,
            'is_active' => true,
            'effective_start_date' => '2026-04-01',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-04',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-04']));

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'base_salary' => 6500000.00,
            'allowances_total' => 800000.00,
            'pph21_method' => 'gross_up',
            'pph21_rate' => 1.00,
            'pph21_allowance' => 73737.00,
            'pph21_deduction' => 73737.00,
            'deductions_total' => 73737.00,
            'net_salary' => 7300000.00,
        ]);
    }

    public function test_pph21_gross_up_uses_minimum_floor_rupiah_tax_allowance(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'first_name' => 'Anisha Taniawati',
            'last_name' => null,
            'base_salary' => 12_000_000,
            'pph21_method' => 'gross_up',
            'pph21_rate' => 6,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Jabatan',
            'amount' => 1_000_000,
            'is_active' => true,
            'effective_start_date' => '2026-04-01',
        ]);

        EmployeeAllowance::query()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'name' => 'Tunjangan Kinerja',
            'amount' => 1_000_000,
            'is_active' => true,
            'effective_start_date' => '2026-04-01',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-04',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-04']));

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'pph21_method' => 'gross_up',
            'pph21_rate' => 6.00,
            'pph21_allowance' => 893616.00,
            'pph21_deduction' => 893616.00,
            'net_salary' => 14000000.00,
        ]);
    }

    public function test_pph21_net_is_company_borne_and_not_cut_from_take_home_pay(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'base_salary' => 4_000_000,
            'pph21_method' => 'net',
            'pph21_rate' => 5,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'pph21_method' => 'net',
            'pph21_company_borne' => 200000.00,
            'pph21_deduction' => 0.00,
            'net_salary' => 4000000.00,
        ]);
    }

    public function test_pph21_ter_harian_calculates_daily_tax_based_on_attendance(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'base_salary' => 3_000_000,
            'pph21_method' => 'ter_harian',
            'pph21_rate' => 2,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        EmployeeAttendance::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'attendance_date' => '2026-02-03',
            'status' => 'present',
        ]);

        EmployeeAttendance::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'attendance_date' => '2026-02-04',
            'status' => 'late',
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseHas('payroll_items', [
            'employee_id' => $employee->id,
            'pph21_method' => 'ter_harian',
            'pph21_deduction' => 60000.00,
            'deductions_total' => 60000.00,
            'net_salary' => 2940000.00,
        ]);
    }

    public function test_generated_payroll_can_be_saved()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->id,
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

    public function test_saved_payroll_payslips_can_be_queued_for_employee_whatsapp(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->id,
            'period' => '2026-02',
            'period_start' => '2026-02-01',
            'period_end' => '2026-02-28',
            'is_saved' => true,
            'saved_at' => now(),
            'saved_by' => $user->id,
        ]);

        $items = collect(range(1, 11))->map(function (int $number) use ($run, $user): PayrollItem {
            $employee = Employee::factory()->create([
                'user_id' => $user->id,
                'employee_code' => 'EMP-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'phone' => '0812345678'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            ]);

            return PayrollItem::query()->create([
                'user_id' => $user->id,
                'payroll_run_id' => $run->id,
                'employee_id' => $employee->id,
                'base_salary' => 5_000_000,
                'allowances_total' => 500_000,
                'pph21_method' => 'gross',
                'pph21_rate' => 5,
                'pph21_allowance' => 0,
                'pph21_deduction' => 100_000,
                'pph21_company_borne' => 0,
                'kasbon_deduction' => 0,
                'denda_deduction' => 0,
                'deductions_total' => 100_000,
                'net_salary' => 5_400_000,
                'allowance_breakdown' => ['Transport' => 500_000],
            ]);
        });

        $this->actingAs($user)
            ->post(route('hris.payrolls.send-payslips', $run))
            ->assertRedirect()
            ->assertSessionHas('success', 'Payslip masuk queue untuk 11 karyawan. 0 dilewati karena nomor WhatsApp tidak valid.');

        Queue::assertPushed(SendPayslipToWhatsApp::class, 11);
        Queue::assertPushed(SendPayslipToWhatsApp::class, function (SendPayslipToWhatsApp $job) use ($items, $user): bool {
            return $job->payrollItemId === $items->last()->id
                && $job->ownerId === $user->id
                && $job->delay !== null
                && now()->diffInSeconds($job->delay, false) >= 55;
        });
    }

    public function test_single_employee_payslip_can_be_queued_for_whatsapp(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'phone' => '081234567890',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->id,
            'period' => '2026-02',
            'is_saved' => true,
        ]);

        $item = PayrollItem::query()->create([
            'user_id' => $user->id,
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'base_salary' => 5_000_000,
            'allowances_total' => 500_000,
            'deductions_total' => 100_000,
            'net_salary' => 5_400_000,
            'allowance_breakdown' => [],
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.items.send-payslip', [$run, $item]))
            ->assertRedirect()
            ->assertSessionHas('success', 'Payslip karyawan masuk queue pengiriman WhatsApp.');

        Queue::assertPushed(SendPayslipToWhatsApp::class, function (SendPayslipToWhatsApp $job) use ($item, $user): bool {
            return $job->payrollItemId === $item->id
                && $job->ownerId === $user->id;
        });
    }

    public function test_unsaved_payroll_payslips_cannot_be_sent_to_whatsapp(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->id,
            'period' => '2026-02',
            'is_saved' => false,
        ]);

        $this->actingAs($user)
            ->post(route('hris.payrolls.send-payslips', $run))
            ->assertRedirect()
            ->assertSessionHas('error', 'Simpan payroll terlebih dahulu sebelum mengirim payslip ke WhatsApp.');

        Queue::assertNothingPushed();
    }

    public function test_two_companies_can_generate_payroll_for_the_same_period(): void
    {
        $firstUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        Employee::factory()->create([
            'user_id' => $firstUser->id,
            'base_salary' => 4_000_000,
            'pph21_method' => 'gross',
            'pph21_rate' => 0,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        Employee::factory()->create([
            'user_id' => $secondUser->id,
            'base_salary' => 4_500_000,
            'pph21_method' => 'gross',
            'pph21_rate' => 0,
            'is_active' => true,
            'employment_status' => 'active',
        ]);

        $this->actingAs($firstUser)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->actingAs($secondUser)
            ->post(route('hris.payrolls.generate'), [
                'period' => '2026-02',
            ])
            ->assertRedirect(route('hris.payrolls.index', ['period' => '2026-02']));

        $this->assertDatabaseCount('payroll_runs', 2);
        $this->assertDatabaseHas('payroll_runs', [
            'user_id' => $firstUser->id,
            'period' => '2026-02',
            'employees_count' => 1,
            'total_base_salary' => 4000000.00,
        ]);
        $this->assertDatabaseHas('payroll_runs', [
            'user_id' => $secondUser->id,
            'period' => '2026-02',
            'employees_count' => 1,
            'total_base_salary' => 4500000.00,
        ]);
    }
}
