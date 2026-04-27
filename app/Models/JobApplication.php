<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    /** @use HasFactory<\Database\Factories\JobApplicationFactory> */
    use BelongsToAccount, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'job_vacancy_id',
        'full_name',
        'email',
        'phone',
        'birth_date',
        'address',
        'last_education',
        'years_experience',
        'current_company',
        'expected_salary',
        'portfolio_url',
        'linkedin_url',
        'cover_letter',
        'resume_path',
        'resume_original_name',
        'stage',
        'interview_scheduled_at',
        'interviewed_at',
        'interview_notes',
        'recruiter_notes',
        'offered_salary',
        'proposed_start_date',
        'employment_type',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'years_experience' => 'decimal:1',
            'expected_salary' => 'decimal:2',
            'interview_scheduled_at' => 'datetime',
            'interviewed_at' => 'datetime',
            'offered_salary' => 'decimal:2',
            'proposed_start_date' => 'date',
        ];
    }

    /**
     * Get vacancy related to this application.
     */
    public function jobVacancy(): BelongsTo
    {
        return $this->belongsTo(JobVacancy::class);
    }
}
