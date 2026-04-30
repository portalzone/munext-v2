<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Jobs\Models\Application;
use Modules\Students\Models\StudentProfile;

#[Fillable(['name', 'email', 'password', 'role', 'is_active', 'banned_at', 'ban_reason', 'employer_approved'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'  => 'datetime',
            'password'           => 'hashed',
            'is_active'          => 'boolean',
            'banned_at'          => 'datetime',
            'employer_approved'  => 'boolean',
        ];
    }

    public function isJobSeeker(): bool
    {
        return in_array($this->role, ['student', 'alumni']);
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'student_id');
    }

    public function jobPostings(): HasMany
    {
        return $this->hasMany(\Modules\Jobs\Models\JobPosting::class, 'employer_id');
    }
}
