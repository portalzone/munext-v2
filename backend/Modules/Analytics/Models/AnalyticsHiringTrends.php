<?php

namespace Modules\Analytics\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsHiringTrends extends Model
{
    protected $table = 'analytics_hiring_trends';

    public $timestamps = false;

    protected $fillable = ['month', 'job_count', 'application_count', 'computed_at'];

    protected $casts = [
        'job_count'         => 'integer',
        'application_count' => 'integer',
        'computed_at'       => 'datetime',
    ];
}
