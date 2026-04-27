<?php

namespace Database\Factories;

use App\Models\Division;
use App\Models\JobVacancy;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobVacancy>
 */
class JobVacancyFactory extends Factory
{
    protected $model = JobVacancy::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->jobTitle();

        return [
            'user_id' => User::factory(),
            'division_id' => Division::factory()->state(fn (array $attributes) => [
                'user_id' => $attributes['user_id'],
            ]),
            'position_id' => Position::factory()->state(fn (array $attributes) => [
                'user_id' => $attributes['user_id'],
                'division_id' => $attributes['division_id'],
            ]),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(100, 999),
            'employment_type' => fake()->randomElement(['permanent', 'contract', 'internship', 'freelance']),
            'workplace_type' => fake()->randomElement(['onsite', 'hybrid', 'remote']),
            'location' => fake()->city(),
            'openings' => fake()->numberBetween(1, 6),
            'min_salary' => 4000000,
            'max_salary' => 7000000,
            'description' => fake()->paragraphs(2, true),
            'requirements' => fake()->paragraphs(2, true),
            'benefits' => fake()->paragraphs(1, true),
            'status' => 'published',
            'published_at' => now(),
            'closing_date' => now()->addWeeks(2)->toDateString(),
        ];
    }
}
