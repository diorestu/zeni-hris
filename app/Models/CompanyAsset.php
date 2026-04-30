<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class CompanyAsset extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyAssetFactory> */
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'user_id',
        'asset_code',
        'name',
        'category',
        'brand',
        'model',
        'serial_number',
        'purchase_date',
        'purchase_price',
        'purchase_proof_path',
        'purchase_proof_original_name',
        'condition',
        'status',
        'useful_life_months',
        'salvage_value',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'purchase_price' => 'decimal:2',
            'salvage_value' => 'decimal:2',
            'useful_life_months' => 'integer',
        ];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(CompanyAssetAssignment::class);
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(CompanyAssetAssignment::class)->whereNull('returned_at')->latestOfMany();
    }

    public function depreciationSummary(?Carbon $asOf = null): array
    {
        $asOf ??= now();
        $purchasePrice = (float) $this->purchase_price;
        $salvageValue = min((float) $this->salvage_value, $purchasePrice);
        $usefulLifeMonths = max((int) $this->useful_life_months, 1);

        if (! $this->purchase_date || $purchasePrice <= 0) {
            return [
                'monthly_depreciation' => 0.0,
                'accumulated_depreciation' => 0.0,
                'book_value' => $purchasePrice,
                'age_months' => 0,
            ];
        }

        $ageMonths = min($this->purchase_date->startOfMonth()->diffInMonths($asOf->copy()->startOfMonth()), $usefulLifeMonths);
        $depreciableAmount = max($purchasePrice - $salvageValue, 0);
        $monthlyDepreciation = $depreciableAmount / $usefulLifeMonths;
        $accumulatedDepreciation = min($monthlyDepreciation * $ageMonths, $depreciableAmount);

        return [
            'monthly_depreciation' => round($monthlyDepreciation, 2),
            'accumulated_depreciation' => round($accumulatedDepreciation, 2),
            'book_value' => round(max($purchasePrice - $accumulatedDepreciation, $salvageValue), 2),
            'age_months' => $ageMonths,
        ];
    }
}
