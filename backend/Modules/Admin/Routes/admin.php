<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Controllers\AdminController;

Route::prefix('v1/admin')->middleware('auth:sanctum')->group(function () {
    Route::get('stats',                          [AdminController::class, 'stats']);
    Route::get('users',                          [AdminController::class, 'users']);
    Route::put('users/{id}/toggle',              [AdminController::class, 'toggleUser']);
    Route::put('users/{id}/promote',             [AdminController::class, 'promoteToAdmin']);
    Route::put('users/{id}/ban',                 [AdminController::class, 'banUser']);
    Route::put('users/{id}/unban',               [AdminController::class, 'unbanUser']);
    Route::put('users/{id}/approve-employer',    [AdminController::class, 'approveEmployer']);
    Route::get('jobs',                           [AdminController::class, 'jobs']);
    Route::put('jobs/{job}/toggle',              [AdminController::class, 'toggleJob']);
    Route::delete('jobs/{job}',                  [AdminController::class, 'deleteJob']);
    Route::get('audit-log',                      [AdminController::class, 'auditLog']);
});
