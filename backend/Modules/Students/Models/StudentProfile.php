<?php

namespace Modules\Students\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class StudentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'program',
        'gpa',
        'graduation_year',
        'skills',
        'resume_path',
    ];

    protected $casts = [
        'skills' => 'array',
        'gpa'    => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
