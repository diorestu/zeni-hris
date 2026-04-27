<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_code' => strtoupper($this->faker->unique()->bothify('EMP-####')),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'birth_date' => $this->faker->date(),
            'last_education' => $this->faker->randomElement(['SMA/SMK', 'D3', 'S1', 'S2']),
            'marital_status' => $this->faker->randomElement(['single', 'married', 'divorced', 'widowed']),
            'children_count' => $this->faker->numberBetween(0, 4),
            'hire_date' => $this->faker->date(),
            'employment_status' => 'active',
            'employment_type' => 'permanent',
            'pph21_method' => 'gross',
            'pph21_rate' => 5,
            'division_id' => null,
            'position_id' => null,
            'manager_id' => null,
            'base_salary' => $this->faker->numberBetween(4_000_000, 15_000_000),
            'address' => $this->faker->address(),
            'family_card_number' => $this->faker->numerify('################'),
            'biological_mother_name' => $this->faker->name(),
            'emergency_contact_name' => $this->faker->name(),
            'emergency_contact_phone' => $this->faker->phoneNumber(),
            'notes' => $this->faker->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
