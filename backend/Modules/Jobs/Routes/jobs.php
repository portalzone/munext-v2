<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Controllers\JobController;
use Modules\Jobs\Controllers\ApplicationController;
use Modules\Jobs\Controllers\SkillMatchController;

Route::middleware('auth:sanctum')->prefix('v1/jobs')->group(function () {
    Route::get('/',         [JobController::class, 'index']);
    Route::get('/my-jobs',  [JobController::class, 'myJobs']);
    Route::get('/{job}',    [JobController::class, 'show']);
    Route::post('/',        [JobController::class, 'store']);
    Route::put('/{job}',    [JobController::class, 'update']);
    Route::delete('/{job}', [JobController::class, 'destroy']);

    // Applications
    Route::post('/{job}/apply',                   [ApplicationController::class, 'store']);
    Route::get('/{job}/applicants',               [ApplicationController::class, 'index']);
    Route::put('/{job}/applicants/{application}', [ApplicationController::class, 'update']);

    // Skill match
    Route::get('/{job}/match', [SkillMatchController::class, 'match']);
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
});
