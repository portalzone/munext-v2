<?php

namespace Modules\Messages\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Modules\Jobs\Models\Application;

class Message extends Model
{
    protected $fillable = ['application_id', 'sender_id', 'body', 'read_at', 'attachment_path', 'attachment_name'];

    protected $casts = ['read_at' => 'datetime'];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function markRead(): void
    {
        if (! $this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }
}
