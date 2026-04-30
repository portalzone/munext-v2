<?php

namespace Modules\Jobs\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Bookmark extends Model
{
    protected $fillable = ['student_id', 'job_id'];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function job()
    {
        return $this->belongsTo(JobPosting::class, 'job_id');
    }
}
