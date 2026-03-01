<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OvertimeRequest>
 */
class OvertimeRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = Carbon::createFromFormat('H:i', '18:00')->addMinutes(random_int(0, 30));
        $end = $start->copy()->addHours(random_int(1, 4));
        $breakMinutes = random_int(0, 30);
        $minutes = max($start->diffInMinutes($end) - $breakMinutes, 0);

        return [
            'employee_id' => Employee::factory(),
            'work_date' => $this->faker->dateTimeBetween('-20 days', '+5 days')->format('Y-m-d'),
            'start_time' => $start->format('H:i'),
            'end_time' => $end->format('H:i'),
            'break_minutes' => $breakMinutes,
            'total_hours' => round($minutes / 60, 2),
            'reason' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'approved_by' => null,
            'approved_at' => null,
            'notes' => null,
        ];
    }
}
