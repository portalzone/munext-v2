<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsSkillsDemand extends Model
{
    protected $table = 'analytics_skills_demand';

    public $timestamps = false;

    protected $fillable = ['skill', 'count', 'trend', 'computed_at'];

    protected $casts = [
        'count'       => 'integer',
        'computed_at' => 'datetime',
    ];
}
