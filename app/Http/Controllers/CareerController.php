<?php

namespace App\Http\Controllers;

use App\Http\Requests\Careers\StoreCareerApplicationRequest;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CareerController extends Controller
{
    /**
     * Display public career list.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'employment_type' => ['nullable', Rule::in(['permanent', 'contract', 'internship', 'freelance'])],
        ]);

        $filters = [
            'search' => $validated['search'] ?? '',
            'employment_type' => $validated['employment_type'] ?? '',
        ];

        $vacancies = $this->publishedVacancies()
            ->with(['division:id,name', 'position:id,name'])
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('location', 'like', '%'.$filters['search'].'%')
                        ->orWhere('description', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['employment_type'] !== '', fn ($query) => $query->where('employment_type', $filters['employment_type']))
            ->orderByDesc('published_at')
            ->paginate(12)
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
                'closing_date' => $vacancy->closing_date?->format('Y-m-d'),
                'division' => $vacancy->division?->name,
                'position' => $vacancy->position?->name,
                'public_url' => route('careers.show', $vacancy->slug),
            ]);

        return Inertia::render('careers/index', [
            'vacancies' => $vacancies,
            'filters' => $filters,
            'options' => [
                'employment_types' => ['permanent', 'contract', 'internship', 'freelance'],
            ],
        ]);
    }

    /**
     * Display vacancy detail and application form.
     */
    public function show(string $slug): Response
    {
        $vacancy = $this->publishedVacancies()
            ->with(['division:id,name', 'position:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('careers/show', [
            'vacancy' => [
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
                'closing_date' => $vacancy->closing_date?->format('Y-m-d'),
                'division' => $vacancy->division?->name,
                'position' => $vacancy->position?->name,
                'apply_url' => route('careers.apply', $vacancy->slug),
                'list_url' => route('careers.index'),
            ],
        ]);
    }

    /**
     * Store public candidate application.
     */
    public function storeApplication(StoreCareerApplicationRequest $request, string $slug): RedirectResponse
    {
        $vacancy = $this->publishedVacancies()
            ->where('slug', $slug)
            ->firstOrFail();

        $validated = $request->validated();
        $resumePath = null;
        $resumeOriginalName = null;

        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('recruitment/resumes', 'public');
            $resumeOriginalName = $request->file('resume')->getClientOriginalName();
        }

        JobApplication::query()->create([
            ...$validated,
            'user_id' => $vacancy->user_id,
            'job_vacancy_id' => $vacancy->id,
            'resume_path' => $resumePath,
            'resume_original_name' => $resumeOriginalName,
            'employment_type' => $vacancy->employment_type,
        ]);

        return redirect()
            ->route('careers.show', $vacancy->slug)
            ->with('success', 'Lamaran berhasil dikirim. Tim HR akan meninjau data Anda.');
    }

    private function publishedVacancies()
    {
        return JobVacancy::query()
            ->where('status', 'published')
            ->where(function ($query): void {
                $query
                    ->whereNull('closing_date')
                    ->orWhereDate('closing_date', '>=', now()->toDateString());
            });
    }
}
