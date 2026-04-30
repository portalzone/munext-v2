<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Controllers\JobController;
use Modules\Jobs\Controllers\ApplicationController;
use Modules\Jobs\Controllers\BookmarkController;
use Modules\Jobs\Controllers\SkillMatchController;

Route::middleware('auth:sanctum')->prefix('v1/jobs')->group(function () {
    // Static routes must come before /{job} to avoid Laravel treating them as a job ID
    Route::get('/',          [JobController::class, 'index']);
    Route::get('/my-jobs',   [JobController::class, 'myJobs']);
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/',         [JobController::class, 'store']);

    // Dynamic routes
    Route::get('/{job}',    [JobController::class, 'show']);
    Route::put('/{job}',    [JobController::class, 'update']);
    Route::delete('/{job}', [JobController::class, 'destroy']);

    // Applications — throttle: 5 submissions per minute per user
    Route::post('/{job}/apply', [ApplicationController::class, 'store'])->middleware('throttle:5,1');
    Route::get('/{job}/applicants',               [ApplicationController::class, 'index']);
    Route::put('/{job}/applicants/{application}', [ApplicationController::class, 'update']);

    // Skill match
    Route::get('/{job}/match', [SkillMatchController::class, 'match']);

    // Bookmarks
    Route::get('/{job}/bookmark',  [BookmarkController::class, 'status']);
    Route::post('/{job}/bookmark', [BookmarkController::class, 'toggle']);
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
});
