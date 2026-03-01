<?php

namespace Database\Factories;

use App\Models\Division;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Position>
 */
class PositionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'division_id' => Division::factory(),
            'parent_position_id' => null,
            'code' => strtoupper($this->faker->unique()->bothify('POS-##??')),
            'name' => $this->faker->jobTitle(),
            'level' => (string) $this->faker->numberBetween(0, 4),
            'description' => $this->faker->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
