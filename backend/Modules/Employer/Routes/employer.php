<?php

use Illuminate\Support\Facades\Route;
use Modules\Employer\Controllers\EmployerProfileController;

Route::middleware('auth:sanctum')->prefix('v1/employer')->group(function () {
    Route::get('/profile',  [EmployerProfileController::class, 'show']);
    Route::post('/profile', [EmployerProfileController::class, 'store']);
    Route::put('/profile',  [EmployerProfileController::class, 'update']);
});
