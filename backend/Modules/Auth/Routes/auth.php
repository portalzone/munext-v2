<?php

use App\Http\Controllers\ContactController;
use Illuminate\Support\Facades\Route;
use Modules\Auth\Controllers\AuthController;

Route::post('v1/contact', [ContactController::class, 'send']);

Route::prefix('v1/auth')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',      [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
