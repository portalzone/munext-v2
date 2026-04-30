<?php

use Illuminate\Support\Facades\Route;
use Modules\ML\Controllers\MLController;

Route::prefix('v1/ml')->middleware('auth:sanctum')->group(function () {
    Route::get('recommendations',                        [MLController::class, 'jobRecommendations']);
    Route::get('match/{jobId}',                          [MLController::class, 'skillMatch']);
    Route::get('match/{jobId}/applicant/{studentId}',    [MLController::class, 'applicantMatch']);
    Route::get('profile-strength',                       [MLController::class, 'profileStrength']);
    Route::get('predict/{jobId}',                        [MLController::class, 'successPredictor']);
    Route::get('funnel',                                 [MLController::class, 'hiringFunnel']);
    Route::get('trends',                                 [MLController::class, 'marketTrends']);
});
