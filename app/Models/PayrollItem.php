<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollItem extends Model
{
    /** @use HasFactory<\Database\Factories\PayrollItemFactory> */
    use HasFactory, BelongsToAccount;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'payroll_run_id',
        'employee_id',
        'base_salary',
        'allowances_total',
        'kasbon_deduction',
        'denda_deduction',
        'deductions_total',
        'net_salary',
        'allowance_breakdown',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'allowances_total' => 'decimal:2',
            'kasbon_deduction' => 'decimal:2',
            'denda_deduction' => 'decimal:2',
            'deductions_total' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'allowance_breakdown' => 'array',
        ];
    }

    /**
     * Get payroll run that owns this item.
     */
    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    /**
     * Get employee that owns this payroll item.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
