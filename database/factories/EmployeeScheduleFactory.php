<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmployeeSchedule>
 */
class EmployeeScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = Carbon::instance($this->faker->dateTimeBetween('first day of this month', 'last day of this month'));
        $shift = $this->faker->randomElement(['OFF', 'SHIFT_A', 'SHIFT_B', 'SHIFT_C', 'WFH']);

        $startTime = null;
        $endTime = null;
        $isDayOff = $shift === 'OFF';

        if (! $isDayOff) {
            [$startTime, $endTime] = match ($shift) {
                'SHIFT_B' => ['10:00', '19:00'],
                'SHIFT_C' => ['13:00', '22:00'],
                default => ['08:00', '17:00'],
            };
        }

        return [
            'employee_id' => Employee::factory(),
            'work_date' => $date->toDateString(),
            'shift_code' => $shift,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'is_day_off' => $isDayOff,
            'notes' => null,
        ];
    }
}
