<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationAnnouncement extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'audience',
        'channel',
        'status',
        'publish_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'publish_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
