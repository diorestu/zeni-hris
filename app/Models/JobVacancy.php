<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobVacancy extends Model
{
    /** @use HasFactory<\Database\Factories\JobVacancyFactory> */
    use BelongsToAccount, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'division_id',
        'position_id',
        'title',
        'slug',
        'employment_type',
        'workplace_type',
        'location',
        'openings',
        'min_salary',
        'max_salary',
        'description',
        'requirements',
        'benefits',
        'status',
        'published_at',
        'closing_date',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'openings' => 'integer',
            'min_salary' => 'decimal:2',
            'max_salary' => 'decimal:2',
            'published_at' => 'datetime',
            'closing_date' => 'date',
        ];
    }

    /**
     * Get division of the vacancy.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get position of the vacancy.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get applications submitted for this vacancy.
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
