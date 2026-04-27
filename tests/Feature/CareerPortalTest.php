<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\JobVacancy;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CareerPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_careers_page_only_shows_published_open_vacancies()
    {
        $this->withoutVite();

        $user = User::factory()->create();
        $division = Division::factory()->create([
            'user_id' => $user->id,
        ]);
        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
        ]);

        JobVacancy::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'title' => 'Visible Vacancy',
            'slug' => 'visible-vacancy',
            'status' => 'published',
            'closing_date' => now()->addWeek()->toDateString(),
        ]);

        JobVacancy::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'title' => 'Draft Vacancy',
            'slug' => 'draft-vacancy',
            'status' => 'draft',
        ]);

        JobVacancy::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'title' => 'Expired Vacancy',
            'slug' => 'expired-vacancy',
            'status' => 'published',
            'closing_date' => now()->subDay()->toDateString(),
        ]);

        $response = $this->get(route('careers.index'));

        $response->assertOk();
        $response->assertSee('Visible Vacancy');
        $response->assertDontSee('Draft Vacancy');
        $response->assertDontSee('Expired Vacancy');
    }

    public function test_candidate_can_submit_application_from_public_vacancy_page()
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $division = Division::factory()->create([
            'user_id' => $user->id,
        ]);
        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
        ]);
        $vacancy = JobVacancy::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'title' => 'Frontend Engineer',
            'slug' => 'frontend-engineer',
            'status' => 'published',
            'closing_date' => now()->addWeeks(2)->toDateString(),
            'employment_type' => 'contract',
        ]);

        $response = $this->post(route('careers.apply', $vacancy->slug), [
            'full_name' => 'Sinta Maharani',
            'email' => 'sinta@example.com',
            'phone' => '081298765432',
            'birth_date' => '1999-08-17',
            'address' => 'Makassar',
            'last_education' => 'S1',
            'years_experience' => '3',
            'current_company' => 'PT Maju',
            'expected_salary' => '8000000',
            'portfolio_url' => 'https://portfolio.example.com',
            'linkedin_url' => 'https://linkedin.com/in/sinta',
            'cover_letter' => 'Saya siap bergabung.',
            'resume' => UploadedFile::fake()->create(
                'cv-sinta.pdf',
                120,
                'application/pdf'
            ),
        ]);

        $response->assertRedirect(route('careers.show', $vacancy->slug));

        $this->assertDatabaseHas('job_applications', [
            'user_id' => $user->id,
            'job_vacancy_id' => $vacancy->id,
            'full_name' => 'Sinta Maharani',
            'phone' => '6281298765432',
            'stage' => 'applied',
            'employment_type' => 'contract',
            'resume_original_name' => 'cv-sinta.pdf',
        ]);

        $this->assertNotNull($vacancy->applications()->first()?->resume_path);

        Storage::disk('public')->assertExists(
            (string) $vacancy->applications()->first()?->resume_path
        );
    }
}
