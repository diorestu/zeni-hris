<?php

namespace Database\Factories;

use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobApplication>
 */
class JobApplicationFactory extends Factory
{
    protected $model = JobApplication::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_vacancy_id' => JobVacancy::factory()->state(fn (array $attributes) => [
                'user_id' => $attributes['user_id'],
            ]),
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'birth_date' => fake()->date(),
            'address' => fake()->address(),
            'last_education' => fake()->randomElement(['SMA/SMK', 'D3', 'S1', 'S2']),
            'years_experience' => fake()->randomFloat(1, 0, 10),
            'current_company' => fake()->company(),
            'expected_salary' => fake()->numberBetween(4000000, 8000000),
            'portfolio_url' => fake()->optional()->url(),
            'linkedin_url' => fake()->optional()->url(),
            'cover_letter' => fake()->paragraph(),
            'stage' => 'applied',
            'employment_type' => fake()->randomElement(['permanent', 'contract', 'internship', 'freelance']),
        ];
    }
}
