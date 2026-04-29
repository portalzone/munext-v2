<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Controllers\AdminController;

Route::prefix('v1/admin')->middleware('auth:sanctum')->group(function () {
    Route::get('stats',              [AdminController::class, 'stats']);
    Route::get('users',              [AdminController::class, 'users']);
    Route::put('users/{id}/toggle',  [AdminController::class, 'toggleUser']);
    Route::get('jobs',               [AdminController::class, 'jobs']);
    Route::put('jobs/{job}/toggle',  [AdminController::class, 'toggleJob']);
    Route::delete('jobs/{job}',      [AdminController::class, 'deleteJob']);
});
