<?php

use Illuminate\Support\Facades\Route;
use Modules\Students\Controllers\StudentProfileController;

Route::middleware('auth:sanctum')->prefix('v1/students')->group(function () {
    Route::get('/my-profile',    [StudentProfileController::class, 'myProfile']);
    Route::post('/resume',       [StudentProfileController::class, 'uploadResume']);
    Route::get('/',              [StudentProfileController::class, 'index']);
    Route::get('/{profile}',     [StudentProfileController::class, 'show']);
    Route::post('/',             [StudentProfileController::class, 'store']);
    Route::put('/{profile}',     [StudentProfileController::class, 'update']);
});
