<?php

namespace Tests\Feature\Hris;

use App\Models\Employee;
use App\Models\EmployeeSurvey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationSurveyModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_and_survey_pages_can_be_opened(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();

        $this->actingAs($user)->get(route('hris.notifications.index'))->assertOk();
        $this->actingAs($user)->get(route('hris.surveys.index'))->assertOk();
    }

    public function test_notification_can_be_created_and_updated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('hris.notifications.store'), [
            'title' => 'Pengumuman libur',
            'message' => 'Kantor libur nasional.',
            'audience' => 'all',
            'channel' => 'portal',
            'status' => 'published',
            'publish_at' => '2026-04-24 09:00:00',
            'expires_at' => '2026-04-30 17:00:00',
        ])->assertRedirect();

        $this->assertDatabaseHas('notification_announcements', [
            'user_id' => $user->id,
            'title' => 'Pengumuman libur',
            'status' => 'published',
        ]);
    }

    public function test_survey_can_be_created_and_receive_employee_response(): void
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)->post(route('hris.surveys.store'), [
            'title' => 'Survey engagement',
            'description' => 'Survey bulanan',
            'questions_text' => "Bagaimana beban kerja minggu ini?\nApa masukan untuk HR?",
            'status' => 'active',
            'is_anonymous' => false,
            'starts_at' => '2026-04-24 09:00:00',
            'ends_at' => '2026-04-30 17:00:00',
        ])->assertRedirect();

        $survey = EmployeeSurvey::query()->firstOrFail();

        $this->assertCount(2, $survey->questions);

        $this->actingAs($user)->post(route('hris.surveys.responses.store', $survey), [
            'employee_id' => $employee->id,
            'answers' => [
                'Beban kerja masih normal.',
                'Perlu jadwal one on one.',
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('employee_survey_responses', [
            'user_id' => $user->id,
            'employee_survey_id' => $survey->id,
            'employee_id' => $employee->id,
        ]);
    }
}
