<?php

namespace App\Http\Controllers\Hris;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hris\StoreJobVacancyRequest;
use App\Http\Requests\Hris\UpdateJobApplicationRequest;
use App\Http\Requests\Hris\UpdateJobVacancyRequest;
use App\Models\CompanySetting;
use App\Models\Division;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\Position;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class RecruitmentController extends Controller
{
    /**
     * Display recruitment dashboard.
     */
    public function index(Request $request): InertiaResponse
    {
        $ownerId = $request->user()->accountOwnerId();

        $rawFilters = $request->validate([
            'vacancy_search' => ['nullable', 'string', 'max:100'],
            'vacancy_status' => ['nullable', Rule::in(['draft', 'published', 'closed'])],
            'application_search' => ['nullable', 'string', 'max:100'],
            'application_stage' => ['nullable', Rule::in(['applied', 'screening', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'])],
            'vacancy_id' => ['nullable', 'integer', Rule::exists('job_vacancies', 'id')->where('user_id', $ownerId)],
            'interviewed' => ['nullable', Rule::in(['yes', 'no'])],
        ]);

        $filters = [
            'vacancy_search' => $rawFilters['vacancy_search'] ?? '',
            'vacancy_status' => $rawFilters['vacancy_status'] ?? '',
            'application_search' => $rawFilters['application_search'] ?? '',
            'application_stage' => $rawFilters['application_stage'] ?? '',
            'vacancy_id' => isset($rawFilters['vacancy_id']) ? (string) $rawFilters['vacancy_id'] : '',
            'interviewed' => $rawFilters['interviewed'] ?? '',
        ];

        $vacancies = JobVacancy::query()
            ->with(['division:id,name', 'position:id,name'])
            ->withCount('applications')
            ->when($filters['vacancy_search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('title', 'like', '%'.$filters['vacancy_search'].'%')
                        ->orWhere('location', 'like', '%'.$filters['vacancy_search'].'%');
                });
            })
            ->when($filters['vacancy_status'] !== '', fn ($query) => $query->where('status', $filters['vacancy_status']))
            ->orderByRaw("CASE status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END")
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate(6, ['*'], 'vacancy_page')
            ->withQueryString()
            ->through(fn (JobVacancy $vacancy) => [
                'id' => $vacancy->id,
                'title' => $vacancy->title,
                'slug' => $vacancy->slug,
                'employment_type' => $vacancy->employment_type,
                'workplace_type' => $vacancy->workplace_type,
                'location' => $vacancy->location,
                'openings' => $vacancy->openings,
                'min_salary' => $vacancy->min_salary,
                'max_salary' => $vacancy->max_salary,
                'description' => $vacancy->description,
                'requirements' => $vacancy->requirements,
                'benefits' => $vacancy->benefits,
                'status' => $vacancy->status,
                'published_at' => $vacancy->published_at?->toDateTimeString(),
                'closing_date' => $vacancy->closing_date?->format('Y-m-d'),
                'applications_count' => $vacancy->applications_count,
                'public_url' => route('careers.show', $vacancy->slug),
                'division' => $vacancy->division ? [
                    'id' => $vacancy->division->id,
                    'name' => $vacancy->division->name,
                ] : null,
                'position' => $vacancy->position ? [
                    'id' => $vacancy->position->id,
                    'name' => $vacancy->position->name,
                ] : null,
            ]);

        $applications = JobApplication::query()
            ->with([
                'jobVacancy:id,title,slug,division_id,position_id,employment_type',
                'jobVacancy.division:id,name',
                'jobVacancy.position:id,name',
            ])
            ->when($filters['application_search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('full_name', 'like', '%'.$filters['application_search'].'%')
                        ->orWhere('email', 'like', '%'.$filters['application_search'].'%')
                        ->orWhere('phone', 'like', '%'.$filters['application_search'].'%')
                        ->orWhereHas('jobVacancy', function ($vacancyQuery) use ($filters): void {
                            $vacancyQuery->where('title', 'like', '%'.$filters['application_search'].'%');
                        });
                });
            })
            ->when($filters['application_stage'] !== '', fn ($query) => $query->where('stage', $filters['application_stage']))
            ->when($filters['vacancy_id'] !== '', fn ($query) => $query->where('job_vacancy_id', $filters['vacancy_id']))
            ->when($filters['interviewed'] === 'yes', fn ($query) => $query->whereNotNull('interviewed_at'))
            ->when($filters['interviewed'] === 'no', fn ($query) => $query->whereNull('interviewed_at'))
            ->orderByDesc('created_at')
            ->paginate(10, ['*'], 'application_page')
            ->withQueryString()
            ->through(fn (JobApplication $application) => [
                'id' => $application->id,
                'job_vacancy_id' => $application->job_vacancy_id,
                'full_name' => $application->full_name,
                'email' => $application->email,
                'phone' => $application->phone,
                'birth_date' => $application->birth_date?->format('Y-m-d'),
                'address' => $application->address,
                'last_education' => $application->last_education,
                'years_experience' => $application->years_experience,
                'current_company' => $application->current_company,
                'expected_salary' => $application->expected_salary,
                'portfolio_url' => $application->portfolio_url,
                'linkedin_url' => $application->linkedin_url,
                'cover_letter' => $application->cover_letter,
                'resume_url' => $application->resume_path
                    ? Storage::disk('public')->url($application->resume_path)
                    : null,
                'resume_original_name' => $application->resume_original_name,
                'stage' => $application->stage,
                'interview_scheduled_at' => $application->interview_scheduled_at?->format('Y-m-d\TH:i'),
                'interviewed_at' => $application->interviewed_at?->format('Y-m-d\TH:i'),
                'interview_notes' => $application->interview_notes,
                'recruiter_notes' => $application->recruiter_notes,
                'offered_salary' => $application->offered_salary,
                'proposed_start_date' => $application->proposed_start_date?->format('Y-m-d'),
                'employment_type' => $application->employment_type,
                'created_at' => $application->created_at?->toDateTimeString(),
                'offer_letter_url' => route('hris.recruitment.applications.offer-letter', $application),
                'initial_contract_url' => route('hris.recruitment.applications.initial-contract', $application),
                'job_vacancy' => $application->jobVacancy ? [
                    'id' => $application->jobVacancy->id,
                    'title' => $application->jobVacancy->title,
                    'slug' => $application->jobVacancy->slug,
                    'employment_type' => $application->jobVacancy->employment_type,
                    'division' => $application->jobVacancy->division ? [
                        'id' => $application->jobVacancy->division->id,
                        'name' => $application->jobVacancy->division->name,
                    ] : null,
                    'position' => $application->jobVacancy->position ? [
                        'id' => $application->jobVacancy->position->id,
                        'name' => $application->jobVacancy->position->name,
                    ] : null,
                ] : null,
            ]);

        $divisionOptions = Division::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Division $division) => [
                'id' => $division->id,
                'name' => $division->name,
            ])
            ->values();

        $positionOptions = Position::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'name' => $position->name,
            ])
            ->values();

        $vacancyOptions = JobVacancy::query()
            ->orderByDesc('published_at')
            ->orderBy('title')
            ->get()
            ->map(fn (JobVacancy $vacancy) => [
                'id' => $vacancy->id,
                'title' => $vacancy->title,
            ])
            ->values();

        return Inertia::render('hris/recruitment/index', [
            'vacancies' => $vacancies,
            'applications' => $applications,
            'divisionOptions' => $divisionOptions,
            'positionOptions' => $positionOptions,
            'vacancyOptions' => $vacancyOptions,
            'filters' => $filters,
            'stats' => [
                'vacancies_total' => JobVacancy::query()->count(),
                'vacancies_published' => JobVacancy::query()->where('status', 'published')->count(),
                'applications_total' => JobApplication::query()->count(),
                'interviewed_total' => JobApplication::query()->whereNotNull('interviewed_at')->count(),
                'offered_total' => JobApplication::query()->whereIn('stage', ['offered', 'hired'])->count(),
            ],
            'options' => [
                'vacancy_statuses' => ['draft', 'published', 'closed'],
                'application_stages' => ['applied', 'screening', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'],
                'employment_types' => ['permanent', 'contract', 'internship', 'freelance'],
                'workplace_types' => ['onsite', 'hybrid', 'remote'],
                'interview_filters' => [
                    ['value' => 'yes', 'label' => 'Sudah interview'],
                    ['value' => 'no', 'label' => 'Belum interview'],
                ],
            ],
        ]);
    }

    /**
     * Store a newly created vacancy.
     */
    public function store(StoreJobVacancyRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);

        JobVacancy::create([
            ...$validated,
            'slug' => $this->generateUniqueSlug($validated['title']),
            'published_at' => ($validated['status'] ?? 'draft') === 'published' ? now() : null,
        ]);

        return back()->with('success', 'Lowongan berhasil ditambahkan.');
    }

    /**
     * Update the specified vacancy.
     */
    public function update(UpdateJobVacancyRequest $request, JobVacancy $jobVacancy): RedirectResponse
    {
        $validated = $request->validated();

        $this->ensurePositionMatchesDivision($validated['position_id'] ?? null, $validated['division_id'] ?? null);

        $publishedAt = $jobVacancy->published_at;

        if (($validated['status'] ?? 'draft') === 'published' && $publishedAt === null) {
            $publishedAt = now();
        }

        if (($validated['status'] ?? 'draft') !== 'published') {
            $publishedAt = null;
        }

        $jobVacancy->update([
            ...$validated,
            'slug' => $jobVacancy->title !== $validated['title']
                ? $this->generateUniqueSlug($validated['title'], $jobVacancy->id)
                : $jobVacancy->slug,
            'published_at' => $publishedAt,
        ]);

        return back()->with('success', 'Lowongan berhasil diperbarui.');
    }

    /**
     * Remove vacancy and related files.
     */
    public function destroy(JobVacancy $jobVacancy): RedirectResponse
    {
        $jobVacancy->loadMissing('applications:id,job_vacancy_id,resume_path');

        foreach ($jobVacancy->applications as $application) {
            if ($application->resume_path) {
                Storage::disk('public')->delete($application->resume_path);
            }
        }

        $jobVacancy->delete();

        return back()->with('success', 'Lowongan berhasil dihapus.');
    }

    /**
     * Update application tracking data.
     */
    public function updateApplication(UpdateJobApplicationRequest $request, JobApplication $jobApplication): RedirectResponse
    {
        $validated = $request->validated();

        if (($validated['stage'] ?? null) === 'interviewed' && empty($validated['interviewed_at'])) {
            $validated['interviewed_at'] = now();
        }

        if (($validated['stage'] ?? null) === 'interview_scheduled' && empty($validated['interview_scheduled_at'])) {
            $validated['interview_scheduled_at'] = now();
        }

        if (($validated['employment_type'] ?? null) === null) {
            $validated['employment_type'] = $jobApplication->employment_type ?: $jobApplication->jobVacancy?->employment_type;
        }

        $jobApplication->update($validated);

        return back()->with('success', 'Tracker kandidat berhasil diperbarui.');
    }

    /**
     * Generate offer letter for candidate.
     */
    public function offerLetter(JobApplication $jobApplication): HttpResponse
    {
        $jobApplication->loadMissing(['jobVacancy.division:id,name', 'jobVacancy.position:id,name']);
        $companySetting = $this->companySetting();
        $offerDate = CarbonImmutable::now();
        $vacancy = $jobApplication->jobVacancy;
        $documentTitle = 'Offering_Letter_'.Str::slug($jobApplication->full_name).'.pdf';

        return Pdf::loadView('hris.contracts.job-offer-letter', [
            'documentTitle' => $documentTitle,
            'companyName' => $companySetting->name,
            'companyDetails' => $companySetting->details ?: '-',
            'application' => $jobApplication,
            'vacancy' => $vacancy,
            'offerNumber' => sprintf('OL/%04d/%s', $jobApplication->id, $offerDate->format('m/Y')),
            'offerDateText' => $offerDate->locale('id')->translatedFormat('d F Y'),
            'employmentTypeLabel' => $this->employmentTypeLabel(
                $jobApplication->employment_type ?: $vacancy?->employment_type
            ),
            'salaryText' => $this->currencyText(
                $jobApplication->offered_salary ?: $jobApplication->expected_salary ?: $vacancy?->max_salary
            ),
            'startDateText' => $jobApplication->proposed_start_date
                ? CarbonImmutable::parse($jobApplication->proposed_start_date)->locale('id')->translatedFormat('d F Y')
                : '-',
        ])
            ->setPaper('a4')
            ->download($documentTitle);
    }

    /**
     * Generate initial contract draft for candidate.
     */
    public function initialContract(JobApplication $jobApplication): HttpResponse
    {
        $jobApplication->loadMissing(['jobVacancy.division:id,name', 'jobVacancy.position:id,name']);
        $companySetting = $this->companySetting();
        $contractDate = CarbonImmutable::now();
        $vacancy = $jobApplication->jobVacancy;
        $documentTitle = 'Kontrak_Awal_'.Str::slug($jobApplication->full_name).'.pdf';

        return Pdf::loadView('hris.contracts.job-initial-contract', [
            'documentTitle' => $documentTitle,
            'companyName' => $companySetting->name,
            'companyDetails' => $companySetting->details ?: '-',
            'application' => $jobApplication,
            'vacancy' => $vacancy,
            'contractNumber' => sprintf('SPK-AWAL/%04d/%s', $jobApplication->id, $contractDate->format('m/Y')),
            'contractDateText' => $contractDate->locale('id')->translatedFormat('d F Y'),
            'employmentTypeLabel' => $this->employmentTypeLabel(
                $jobApplication->employment_type ?: $vacancy?->employment_type
            ),
            'salaryText' => $this->currencyText(
                $jobApplication->offered_salary ?: $jobApplication->expected_salary ?: $vacancy?->max_salary
            ),
            'startDateText' => $jobApplication->proposed_start_date
                ? CarbonImmutable::parse($jobApplication->proposed_start_date)->locale('id')->translatedFormat('d F Y')
                : '-',
        ])
            ->setPaper('a4')
            ->download($documentTitle);
    }

    private function ensurePositionMatchesDivision(null|int|string $positionId, null|int|string $divisionId): void
    {
        if ($positionId === null || $divisionId === null || $positionId === '' || $divisionId === '') {
            return;
        }

        $positionDivisionId = Position::query()->whereKey($positionId)->value('division_id');

        if ($positionDivisionId !== null && (int) $positionDivisionId !== (int) $divisionId) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'position_id' => 'Jabatan harus berasal dari divisi yang sama.',
            ]);
        }
    }

    private function generateUniqueSlug(string $title, ?int $ignoreVacancyId = null): string
    {
        $baseSlug = Str::slug($title);
        $baseSlug = $baseSlug === '' ? 'lowongan' : $baseSlug;
        $candidate = $baseSlug;
        $counter = 2;

        while (
            JobVacancy::query()
                ->when($ignoreVacancyId !== null, fn ($query) => $query->whereKeyNot($ignoreVacancyId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $candidate;
    }

    private function companySetting(): CompanySetting
    {
        return CompanySetting::query()->firstOrCreate(
            ['user_id' => request()->user()->accountOwnerId()],
            [
                'name' => 'Perusahaan',
                'details' => null,
                'employee_code_prefix' => 'EMP',
                'employee_code_digits' => 4,
                'employee_code_next_number' => 1,
            ],
        );
    }

    private function employmentTypeLabel(?string $employmentType): string
    {
        return match ($employmentType) {
            'contract' => 'Kontrak',
            'internship' => 'Magang',
            'freelance' => 'Freelance',
            default => 'Tetap',
        };
    }

    private function currencyText(mixed $amount): string
    {
        if ($amount === null || $amount === '') {
            return '-';
        }

        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }
}
