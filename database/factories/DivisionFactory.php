<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Division>
 */
class DivisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->company();

        return [
            'code' => strtoupper($this->faker->unique()->bothify('DIV-##??')),
            'name' => $name,
            'description' => $this->faker->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
