<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmployeeBankAccount>
 */
class EmployeeBankAccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI']),
            'account_number' => $this->faker->unique()->numerify('##########'),
            'account_holder_name' => $this->faker->name(),
            'branch' => $this->faker->city(),
            'currency' => 'IDR',
            'is_primary' => false,
        ];
    }
}
