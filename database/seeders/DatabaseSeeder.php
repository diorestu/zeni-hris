<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeBankAccount;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeAllowance;
use App\Models\CompanySetting;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeSchedule;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\Position;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $owner = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'role' => 'admin',
                'parent_user_id' => null,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'subuser@example.com'],
            [
                'name' => 'Sub User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'role' => 'user',
                'parent_user_id' => $owner->id,
            ]
        );

        CompanySetting::query()->updateOrCreate(
            ['user_id' => $owner->id],
            [
                'name' => 'PaperTime Demo',
                'details' => 'Demo company profile',
            ]
        );

        $divisionSeeds = [
            ['code' => 'MGT', 'name' => 'Management'],
            ['code' => 'COM', 'name' => 'Commercial'],
            ['code' => 'OPS', 'name' => 'Operational'],
            ['code' => 'ITD', 'name' => 'IT & Digital'],
            ['code' => 'FIN', 'name' => 'Finance'],
            ['code' => 'HR', 'name' => 'Human Resources'],
            ['code' => 'PRC', 'name' => 'Procurement'],
        ];

        $divisions = collect($divisionSeeds)->mapWithKeys(function (array $divisionSeed) use ($owner): array {
            $division = Division::query()->updateOrCreate(
                ['code' => $divisionSeed['code']],
                [
                    'user_id' => $owner->id,
                    'name' => $divisionSeed['name'],
                    'description' => null,
                    'is_active' => true,
                ]
            );

            return [$divisionSeed['name'] => $division];
        });

        $positionSeeds = [
            ['key' => 'president_director', 'division' => 'Management', 'code' => 'POS-PDIR', 'name' => 'President Director', 'level' => '0', 'parent' => null],

            ['key' => 'head_commercial', 'division' => 'Commercial', 'code' => 'POS-HCOM', 'name' => 'Commercial Head', 'level' => '1', 'parent' => 'president_director'],
            ['key' => 'head_it', 'division' => 'IT & Digital', 'code' => 'POS-HIT', 'name' => 'IT Head', 'level' => '1', 'parent' => 'president_director'],
            ['key' => 'head_finance', 'division' => 'Finance', 'code' => 'POS-HFIN', 'name' => 'Finance Head', 'level' => '1', 'parent' => 'president_director'],
            ['key' => 'head_hr', 'division' => 'Human Resources', 'code' => 'POS-HHR', 'name' => 'HR Head', 'level' => '1', 'parent' => 'president_director'],
            ['key' => 'head_procurement', 'division' => 'Procurement', 'code' => 'POS-HPRC', 'name' => 'Procurement Head', 'level' => '1', 'parent' => 'president_director'],
            ['key' => 'head_operation', 'division' => 'Operational', 'code' => 'POS-HOPS', 'name' => 'Operation Head', 'level' => '1', 'parent' => 'president_director'],

            ['key' => 'manager_it', 'division' => 'IT & Digital', 'code' => 'POS-MIT', 'name' => 'IT Manager', 'level' => '2', 'parent' => 'head_it'],
            ['key' => 'manager_finance', 'division' => 'Finance', 'code' => 'POS-MFIN', 'name' => 'Finance Manager', 'level' => '2', 'parent' => 'head_finance'],
            ['key' => 'manager_hr', 'division' => 'Human Resources', 'code' => 'POS-MHR', 'name' => 'HR Manager', 'level' => '2', 'parent' => 'head_hr'],
            ['key' => 'manager_ga', 'division' => 'Human Resources', 'code' => 'POS-MGA', 'name' => 'GA Manager', 'level' => '2', 'parent' => 'head_hr'],
            ['key' => 'manager_recruitment', 'division' => 'Human Resources', 'code' => 'POS-MREC', 'name' => 'Recruitment Manager', 'level' => '2', 'parent' => 'head_hr'],
            ['key' => 'manager_operation', 'division' => 'Operational', 'code' => 'POS-MOPS', 'name' => 'Operation Manager', 'level' => '2', 'parent' => 'head_operation'],

            ['key' => 'senior_it', 'division' => 'IT & Digital', 'code' => 'POS-SIT', 'name' => 'Senior IT', 'level' => '3', 'parent' => 'manager_it'],
            ['key' => 'senior_marketing', 'division' => 'Commercial', 'code' => 'POS-SMKT', 'name' => 'Senior Marketing', 'level' => '3', 'parent' => 'head_commercial'],
            ['key' => 'senior_sales', 'division' => 'Commercial', 'code' => 'POS-SSLS', 'name' => 'Senior Sales', 'level' => '3', 'parent' => 'head_commercial'],
            ['key' => 'senior_accounting_1', 'division' => 'Finance', 'code' => 'POS-SACC1', 'name' => 'Senior Accounting', 'level' => '3', 'parent' => 'manager_finance'],
            ['key' => 'senior_accounting_2', 'division' => 'Finance', 'code' => 'POS-SACC2', 'name' => 'Senior Accounting', 'level' => '3', 'parent' => 'manager_finance'],

            ['key' => 'staff_commercial', 'division' => 'Commercial', 'code' => 'POS-STFCM', 'name' => 'Staff', 'level' => '4', 'parent' => 'senior_sales'],
            ['key' => 'staff_it', 'division' => 'IT & Digital', 'code' => 'POS-STFIT', 'name' => 'Staff', 'level' => '4', 'parent' => 'senior_it'],
            ['key' => 'staff_finance', 'division' => 'Finance', 'code' => 'POS-STFFN', 'name' => 'Staff', 'level' => '4', 'parent' => 'senior_accounting_1'],
            ['key' => 'staff_hr', 'division' => 'Human Resources', 'code' => 'POS-STFHR', 'name' => 'Staff', 'level' => '4', 'parent' => 'manager_recruitment'],
            ['key' => 'staff_procurement', 'division' => 'Procurement', 'code' => 'POS-STFPC', 'name' => 'Staff', 'level' => '4', 'parent' => 'head_procurement'],
            ['key' => 'staff_operational', 'division' => 'Operational', 'code' => 'POS-STFOP', 'name' => 'Staff', 'level' => '4', 'parent' => 'manager_operation'],
        ];

        $positionsByKey = collect();
        $positions = collect();

        foreach ($positionSeeds as $positionSeed) {
            /** @var Division $division */
            $division = $divisions->get($positionSeed['division']);

            $parentPositionId = null;

            if ($positionSeed['parent'] !== null) {
                $parentPositionId = $positionsByKey->get($positionSeed['parent'])?->id;
            }

            $position = Position::query()->updateOrCreate(
                ['code' => $positionSeed['code']],
                [
                    'user_id' => $owner->id,
                    'division_id' => $division->id,
                    'parent_position_id' => $parentPositionId,
                    'name' => $positionSeed['name'],
                    'level' => $positionSeed['level'],
                    'description' => null,
                    'is_active' => true,
                ]
            );

            $positionsByKey->put($positionSeed['key'], $position);
            $positions->push($position);
        }

        $employees = Employee::factory(max(20, $positions->count()))
            ->create(['user_id' => $owner->id]);

        $positionEmployeeMap = collect();

        $employees->values()->each(function (Employee $employee, int $index) use ($positions, $divisions, $positionEmployeeMap): void {
            /** @var Position|null $position */
            $position = $positions->get($index);

            $divisionId = $position?->division_id ?? $divisions->random()->id;

            $employee->update([
                'division_id' => $divisionId,
                'position_id' => $position?->id,
            ]);

            if ($position !== null) {
                $positionEmployeeMap->put($position->id, $employee->id);
            }
        });

        $positionsById = $positions->keyBy('id');

        $employees->each(function (Employee $employee) use ($positionsById, $positionEmployeeMap): void {
            if ($employee->position_id === null) {
                return;
            }

            /** @var Position|null $position */
            $position = $positionsById->get($employee->position_id);

            if ($position === null || $position->parent_position_id === null) {
                return;
            }

            $managerId = $positionEmployeeMap->get($position->parent_position_id);

            if ($managerId !== null && (int) $managerId !== (int) $employee->id) {
                $employee->update([
                    'manager_id' => $managerId,
                ]);
            }
        });

        $employees->each(function (Employee $employee) use ($owner): void {
            $primary = EmployeeBankAccount::factory()->create([
                'employee_id' => $employee->id,
                'user_id' => $owner->id,
                'is_primary' => true,
            ]);

            EmployeeBankAccount::factory()->create([
                'employee_id' => $employee->id,
                'user_id' => $owner->id,
                'is_primary' => false,
                'currency' => $primary->currency,
            ]);
        })->each(function (Employee $employee) use ($owner): void {
            $employee->update(['user_id' => $owner->id]);
        });

        $employees->each(function (Employee $employee) use ($owner): void {
            $allowances = collect([
                ['name' => 'Tunjangan Makan', 'amount' => random_int(250_000, 500_000)],
                ['name' => 'Tunjangan Transport', 'amount' => random_int(300_000, 700_000)],
                ['name' => 'Tunjangan Komunikasi', 'amount' => random_int(150_000, 350_000)],
            ])->shuffle()->take(random_int(1, 3));

            foreach ($allowances as $allowance) {
                EmployeeAllowance::query()->create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'name' => $allowance['name'],
                    'amount' => $allowance['amount'],
                    'is_active' => true,
                    'effective_start_date' => now()->startOfYear()->toDateString(),
                    'effective_end_date' => null,
                    'notes' => null,
                ]);
            }

            if (random_int(1, 100) <= 45) {
                EmployeeDeduction::query()->create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'type' => 'kasbon',
                    'amount' => random_int(100_000, 600_000),
                    'deduction_date' => now()->toDateString(),
                    'notes' => 'Kasbon bulanan',
                ]);
            }

            if (random_int(1, 100) <= 35) {
                EmployeeDeduction::query()->create([
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'type' => 'denda',
                    'amount' => random_int(50_000, 300_000),
                    'deduction_date' => now()->toDateString(),
                    'notes' => 'Denda kedisiplinan',
                ]);
            }
        });

        $attendanceRows = [];
        $now = now();

        foreach ($employees as $employee) {
            foreach (range(0, 13) as $daysAgo) {
                $date = Carbon::now()->subDays($daysAgo)->startOfDay();
                $chance = random_int(1, 100);

                $status = match (true) {
                    $chance <= 72 => 'present',
                    $chance <= 84 => 'late',
                    $chance <= 92 => 'on_leave',
                    default => 'absent',
                };

                $checkInAt = null;
                $checkOutAt = null;
                $notes = null;

                if (in_array($status, ['present', 'late'], true)) {
                    $checkInAt = (clone $date)
                        ->setTime(8, 0)
                        ->addMinutes($status === 'late' ? random_int(10, 80) : random_int(0, 15));

                    $checkOutAt = (clone $checkInAt)->addHours(random_int(8, 10));
                }

                if ($status === 'on_leave') {
                    $notes = 'Approved leave';
                }

                $attendanceRows[] = [
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'attendance_date' => $date->toDateString(),
                    'status' => $status,
                    'check_in_at' => $checkInAt,
                    'check_out_at' => $checkOutAt,
                    'notes' => $notes,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        EmployeeAttendance::query()->upsert(
            $attendanceRows,
            ['employee_id', 'attendance_date'],
            ['status', 'check_in_at', 'check_out_at', 'notes', 'updated_at']
        );

        $scheduleRows = [];
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        foreach ($employees as $employee) {
            $cursor = $monthStart->copy();

            while ($cursor->lte($monthEnd)) {
                $isWeekend = $cursor->isWeekend();
                $shift = $isWeekend
                    ? 'OFF'
                    : collect(['SHIFT_A', 'SHIFT_B', 'SHIFT_C', 'WFH'])->random();

                [$startTime, $endTime] = match ($shift) {
                    'SHIFT_B' => ['10:00', '19:00'],
                    'SHIFT_C' => ['13:00', '22:00'],
                    'WFH', 'SHIFT_A' => ['08:00', '17:00'],
                    default => [null, null],
                };

                $scheduleRows[] = [
                    'user_id' => $owner->id,
                    'employee_id' => $employee->id,
                    'work_date' => $cursor->toDateString(),
                    'shift_code' => $shift,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'is_day_off' => $shift === 'OFF',
                    'notes' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $cursor = $cursor->addDay();
            }
        }

        EmployeeSchedule::query()->upsert(
            $scheduleRows,
            ['employee_id', 'work_date'],
            ['shift_code', 'start_time', 'end_time', 'is_day_off', 'notes', 'updated_at']
        );

        $employees->each(function (Employee $employee) use ($owner): void {
            LeaveRequest::factory(random_int(0, 2))->create([
                'employee_id' => $employee->id,
                'user_id' => $owner->id,
            ]);

            OvertimeRequest::factory(random_int(1, 3))->create([
                'employee_id' => $employee->id,
                'user_id' => $owner->id,
            ]);
        });
    }
}
