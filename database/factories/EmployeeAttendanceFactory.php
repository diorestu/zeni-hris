<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmployeeAttendance>
 */
class EmployeeAttendanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $attendanceDate = Carbon::instance($this->faker->dateTimeBetween('-30 days', 'now'))->startOfDay();
        $status = $this->faker->randomElement(['present', 'late', 'on_leave', 'absent']);
        $checkIn = null;
        $checkOut = null;

        if (in_array($status, ['present', 'late'], true)) {
            $checkIn = (clone $attendanceDate)
                ->setTime(8, 0)
                ->addMinutes($status === 'late' ? random_int(10, 80) : random_int(0, 15));

            $checkOut = (clone $checkIn)->addHours(random_int(8, 10));
        }

        return [
            'employee_id' => Employee::factory(),
            'attendance_date' => $attendanceDate->toDateString(),
            'status' => $status,
            'check_in_at' => $checkIn,
            'check_out_at' => $checkOut,
            'notes' => $status === 'on_leave' ? 'Approved leave' : null,
        ];
    }
}
