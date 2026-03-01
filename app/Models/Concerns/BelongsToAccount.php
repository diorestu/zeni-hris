<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait BelongsToAccount
{
    /**
     * Cache table ownership check to avoid repeated schema lookups.
     *
     * @var array<string, bool>
     */
    protected static array $accountColumnCache = [];

    public static function bootBelongsToAccount(): void
    {
        static::addGlobalScope('account_owner', function (Builder $builder): void {
            if (! Auth::check() || ! static::hasUserIdColumn()) {
                return;
            }

            $builder->where(
                $builder->qualifyColumn('user_id'),
                Auth::user()->accountOwnerId(),
            );
        });

        static::creating(function (Model $model): void {
            if (! Auth::check() || ! static::hasUserIdColumn()) {
                return;
            }

            if (! $model->getAttribute('user_id')) {
                $model->setAttribute('user_id', Auth::user()->accountOwnerId());
            }
        });
    }

    private static function hasUserIdColumn(): bool
    {
        $table = (new static())->getTable();

        if (! array_key_exists($table, static::$accountColumnCache)) {
            static::$accountColumnCache[$table] = Schema::hasColumn($table, 'user_id');
        }

        return static::$accountColumnCache[$table];
    }
}
