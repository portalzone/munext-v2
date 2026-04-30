<?php

use Illuminate\Support\Facades\Route;
use Modules\Notifications\Controllers\NotificationController;

Route::middleware('auth:sanctum')->prefix('v1/notifications')->group(function () {
    Route::get('/',            [NotificationController::class, 'index']);
    Route::put('/read-all',    [NotificationController::class, 'markAllRead']);
    Route::put('/{id}/read',   [NotificationController::class, 'markRead']);
});
