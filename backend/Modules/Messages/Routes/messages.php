<?php

use Illuminate\Support\Facades\Route;
use Modules\Messages\Controllers\MessageController;

Route::middleware('auth:sanctum')->prefix('v1/messages')->group(function () {
    Route::get('/unread-count',         [MessageController::class, 'unreadCount']);
    Route::post('/broadcast/{jobId}',   [MessageController::class, 'broadcast']);
    Route::get('/{applicationId}',      [MessageController::class, 'thread']);
    Route::post('/{applicationId}',     [MessageController::class, 'send']);
});
