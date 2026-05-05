<?php

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Controllers\AnalyticsController;

Route::prefix('v1/analytics')->group(function () {
    Route::get('/skills-demand',        [AnalyticsController::class, 'skillsDemand']);
    Route::get('/hiring-trends',        [AnalyticsController::class, 'hiringTrends']);
    Route::get('/salary-distribution',  [AnalyticsController::class, 'salaryDistribution']);
    Route::get('/top-employers',        [AnalyticsController::class, 'topEmployers']);
});
