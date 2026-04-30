<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeFactory> */
    use BelongsToAccount, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'employee_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'birth_date',
        'last_education',
        'marital_status',
        'children_count',
        'hire_date',
        'employment_status',
        'employment_type',
        'pph21_method',
        'pph21_rate',
        'ptkp_category',
        'division_id',
        'position_id',
        'manager_id',
        'base_salary',
        'address',
        'family_card_number',
        'bpjs_kesehatan_number',
        'bpjs_ketenagakerjaan_number',
        'sim_a_number',
        'sim_b_number',
        'sim_c_number',
        'biological_mother_name',
        'emergency_contact_name',
        'emergency_contact_phone',
        'notes',
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
            'birth_date' => 'date',
            'children_count' => 'integer',
            'hire_date' => 'date',
            'base_salary' => 'decimal:2',
            'pph21_rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the division of this employee.
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the position of this employee.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get the manager of this employee.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    /**
     * Get direct reports under this employee.
     */
    public function directReports(): HasMany
    {
        return $this->hasMany(self::class, 'manager_id');
    }

    /**
     * Get all bank accounts of this employee.
     */
    public function bankAccounts(): HasMany
    {
        return $this->hasMany(EmployeeBankAccount::class);
    }

    /**
     * Get attendance records of this employee.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(EmployeeAttendance::class);
    }

    /**
     * Get schedules assigned to this employee.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    /**
     * Get leave requests of this employee.
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * Get overtime requests of this employee.
     */
    public function overtimeRequests(): HasMany
    {
        return $this->hasMany(OvertimeRequest::class);
    }

    /**
     * Get allowance records of this employee.
     */
    public function allowances(): HasMany
    {
        return $this->hasMany(EmployeeAllowance::class);
    }

    /**
     * Get deduction records of this employee.
     */
    public function deductions(): HasMany
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    /**
     * Get payroll items of this employee.
     */
    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    /**
     * Get asset assignment history for this employee.
     */
    public function assetAssignments(): HasMany
    {
        return $this->hasMany(CompanyAssetAssignment::class);
    }

    /**
     * Build a full name from first and last name.
     */
    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([$this->first_name, $this->last_name])));
    }
}
