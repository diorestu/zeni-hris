<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeaveRequest>
 */
class LeaveRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = Carbon::instance($this->faker->dateTimeBetween('-30 days', '+30 days'))->startOfDay();
        $totalDays = random_int(1, 5);
        $endDate = $startDate->copy()->addDays($totalDays - 1);
        $status = $this->faker->randomElement(['pending', 'approved', 'rejected']);

        return [
            'employee_id' => Employee::factory(),
            'leave_type' => $this->faker->randomElement(['annual', 'sick', 'unpaid', 'other']),
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_days' => $totalDays,
            'reason' => $this->faker->sentence(),
            'status' => $status,
            'approved_by' => null,
            'approved_at' => $status === 'approved' ? now() : null,
            'rejection_reason' => $status === 'rejected' ? 'Dokumen pendukung tidak lengkap' : null,
        ];
    }
}
