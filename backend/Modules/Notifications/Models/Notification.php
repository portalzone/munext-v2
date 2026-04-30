<?php

namespace Modules\Notifications\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'message', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markRead(): void
    {
        if (! $this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }
}
