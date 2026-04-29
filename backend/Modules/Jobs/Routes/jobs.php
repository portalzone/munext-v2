<?php

use Illuminate\Support\Facades\Route;
use Modules\Jobs\Controllers\JobController;

Route::middleware('auth:sanctum')->prefix('v1/jobs')->group(function () {
    Route::get('/',         [JobController::class, 'index']);
    Route::get('/my-jobs',  [JobController::class, 'myJobs']);
    Route::get('/{job}',    [JobController::class, 'show']);
    Route::post('/',       [JobController::class, 'store']);
    Route::put('/{job}',   [JobController::class, 'update']);
    Route::delete('/{job}',[JobController::class, 'destroy']);
});
