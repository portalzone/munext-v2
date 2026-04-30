<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Controllers\JobController;
use Modules\Jobs\Controllers\ApplicationController;
use Modules\Jobs\Controllers\BookmarkController;
use Modules\Jobs\Controllers\SkillMatchController;

// ── Public routes (no auth required) ─────────────────────────────────────────
// Static public routes must be declared before the dynamic /{job} catch-all.

Route::prefix('v1/jobs')->group(function () {
    Route::get('/',      [JobController::class, 'index']);
});

// ── Auth-required static routes (must be registered before /{job}) ───────────

Route::middleware('auth:sanctum')->prefix('v1/jobs')->group(function () {
    Route::get('/my-jobs',         [JobController::class, 'myJobs']);
    Route::get('/bookmarks',       [BookmarkController::class, 'index']);
    Route::get('/my-applications', [ApplicationController::class, 'myApplications']);
    Route::post('/',               [JobController::class, 'store']);
});

// ── Public single-job route ───────────────────────────────────────────────────

Route::prefix('v1/jobs')->group(function () {
    Route::get('/{job}', [JobController::class, 'show']);
});

// ── Auth-required job-specific routes ────────────────────────────────────────

Route::middleware('auth:sanctum')->prefix('v1/jobs')->group(function () {
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

