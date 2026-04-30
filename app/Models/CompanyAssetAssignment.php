<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyAssetAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyAssetAssignmentFactory> */
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'user_id',
        'company_asset_id',
        'employee_id',
        'issued_at',
        'returned_at',
        'condition_out',
        'condition_in',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'returned_at' => 'date',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(CompanyAsset::class, 'company_asset_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
