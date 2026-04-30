<?php

namespace Modules\Jobs\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Modules\Employer\Models\EmployerProfile;

class JobPosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'employer_id',
        'title',
        'description',
        'skills_required',
        'experience_level',
        'category',
        'job_type',
        'location',
        'is_remote',
        'salary_min',
        'salary_max',
        'is_active',
    ];

    protected $casts = [
        'skills_required' => 'array',
        'is_active'       => 'boolean',
        'is_remote'       => 'boolean',
        'salary_min'      => 'integer',
        'salary_max'      => 'integer',
    ];

    public function employer()
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function employerProfile()
    {
        return $this->hasOneThrough(
            EmployerProfile::class,
            User::class,
            'id',
            'user_id',
            'employer_id',
            'id'
        );
    }
}
