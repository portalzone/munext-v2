<?php

namespace Modules\Jobs\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Application extends Model
{
    protected $fillable = [
        'student_id',
        'job_id',
        'status',
        'cover_letter',
        'applied_at',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function job()
    {
        return $this->belongsTo(JobPosting::class, 'job_id');
    }

    public function messages()
    {
        return $this->hasMany(\Modules\Messages\Models\Message::class, 'application_id');
    }
}
