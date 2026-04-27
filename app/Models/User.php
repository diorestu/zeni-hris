<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'company_name',
        'email',
        'phone',
        'password',
        'role',
        'parent_user_id',
        'phone_verified_at',
        'whatsapp_otp_code',
        'whatsapp_otp_sent_at',
        'whatsapp_otp_expires_at',
        'requires_password_change',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'whatsapp_otp_code',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'whatsapp_otp_sent_at' => 'datetime',
            'whatsapp_otp_expires_at' => 'datetime',
            'requires_password_change' => 'boolean',
            'password_changed_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Determine whether the account has been activated via WhatsApp OTP.
     */
    public function hasActivatedAccount(): bool
    {
        return $this->phone_verified_at !== null;
    }

    /**
     * Get parent admin account if this is a sub-user.
     */
    public function parentUser(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_user_id');
    }

    /**
     * Get sub-users created by this user.
     */
    public function subUsers(): HasMany
    {
        return $this->hasMany(self::class, 'parent_user_id');
    }

    /**
     * Resolve the owner account id for data isolation.
     */
    public function accountOwnerId(): int
    {
        return (int) ($this->parent_user_id ?: $this->id);
    }

    /**
     * Determine whether this user can manage sub-users.
     */
    public function canManageSubUsers(): bool
    {
        return $this->role === 'admin' && $this->parent_user_id === null;
    }
}
