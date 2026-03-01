<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    /** @use HasFactory<\Database\Factories\PositionFactory> */
    use HasFactory, BelongsToAccount;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'division_id',
        'parent_position_id',
        'code',
        'name',
        'level',
        'description',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the division that owns this position.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the parent position of this position.
     */
    public function parentPosition(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_position_id');
    }

    /**
     * Get sub positions under this position.
     */
    public function childPositions(): HasMany
    {
        return $this->hasMany(self::class, 'parent_position_id');
    }

    /**
     * Get employees assigned to this position.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
