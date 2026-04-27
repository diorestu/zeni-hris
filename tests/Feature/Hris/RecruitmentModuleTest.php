<?php

namespace Tests\Feature\Hris;

use App\Models\Division;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecruitmentModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_open_recruitment_page()
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('hris.recruitment.index'))
            ->assertOk();
    }

    public function test_admin_can_create_vacancy_and_update_candidate_tracker()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'name' => 'People Operations',
        ]);
        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'name' => 'Recruitment Specialist',
            'level' => '4',
        ]);

        $this->actingAs($user)->post(route('hris.recruitment.vacancies.store'), [
            'title' => 'Recruitment Specialist',
            'division_id' => $division->id,
            'position_id' => $position->id,
            'employment_type' => 'permanent',
            'workplace_type' => 'onsite',
            'location' => 'Makassar',
            'openings' => 2,
            'min_salary' => '5000000',
            'max_salary' => '7000000',
            'description' => 'Handle end-to-end recruitment.',
            'requirements' => 'Minimum 2 years experience.',
            'benefits' => 'BPJS and bonus.',
            'status' => 'published',
            'closing_date' => now()->addWeeks(2)->toDateString(),
        ])->assertRedirect();

        $vacancy = JobVacancy::query()->first();

        $this->assertNotNull($vacancy);
        $this->assertDatabaseHas('job_vacancies', [
            'id' => $vacancy->id,
            'user_id' => $user->id,
            'title' => 'Recruitment Specialist',
            'slug' => 'recruitment-specialist',
            'status' => 'published',
        ]);

        $application = JobApplication::query()->create([
            'user_id' => $user->id,
            'job_vacancy_id' => $vacancy->id,
            'full_name' => 'Dewi Puspita',
            'email' => 'dewi@example.com',
            'phone' => '081234567890',
            'stage' => 'screening',
        ]);

        $this->actingAs($user)->put(
            route('hris.recruitment.applications.update', $application),
            [
                'stage' => 'interviewed',
                'interview_scheduled_at' => '2026-04-10 09:00:00',
                'interviewed_at' => '2026-04-10 10:30:00',
                'interview_notes' => 'Komunikasi baik dan cukup siap.',
                'recruiter_notes' => 'Lanjut ke offering.',
                'expected_salary' => '6500000',
                'offered_salary' => '6200000',
                'proposed_start_date' => '2026-05-01',
                'employment_type' => 'permanent',
            ]
        )->assertRedirect();

        $this->assertDatabaseHas('job_applications', [
            'id' => $application->id,
            'stage' => 'interviewed',
            'offered_salary' => '6200000.00',
            'employment_type' => 'permanent',
        ]);
    }

    public function test_admin_can_generate_offer_letter_and_initial_contract_for_candidate()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'name' => 'Operations',
        ]);
        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'name' => 'Supervisor',
            'level' => '3',
        ]);
        $vacancy = JobVacancy::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'title' => 'Supervisor',
            'slug' => 'supervisor',
            'status' => 'published',
        ]);
        $application = JobApplication::factory()->create([
            'user_id' => $user->id,
            'job_vacancy_id' => $vacancy->id,
            'full_name' => 'Raka Pratama',
            'offered_salary' => 7800000,
            'proposed_start_date' => '2026-05-05',
            'employment_type' => 'contract',
        ]);

        $offerResponse = $this->actingAs($user)->get(
            route('hris.recruitment.applications.offer-letter', $application)
        );

        $offerResponse->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $offerResponse->headers->get('content-type')
        );

        $contractResponse = $this->actingAs($user)->get(
            route('hris.recruitment.applications.initial-contract', $application)
        );

        $contractResponse->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            (string) $contractResponse->headers->get('content-type')
        );
    }
}
