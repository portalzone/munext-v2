<?php

namespace Modules\Jobs\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

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
        'salary_min',
        'salary_max',
        'is_active',
    ];

    protected $casts = [
        'skills_required' => 'array',
        'is_active'       => 'boolean',
        'salary_min'      => 'integer',
        'salary_max'      => 'integer',
    ];

    // A job posting belongs to an employer (User)
    public function employer()
    {
        return $this->belongsTo(User::class, 'employer_id');
    }
}
