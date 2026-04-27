<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeSurvey extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'questions',
        'status',
        'is_anonymous',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'questions' => 'array',
            'is_anonymous' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function responses(): HasMany
    {
        return $this->hasMany(EmployeeSurveyResponse::class);
    }
}
