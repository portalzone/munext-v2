<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Auth/Routes/auth.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Jobs/Routes/jobs.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Students/Routes/students.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/ML/Routes/ml.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Admin/Routes/admin.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Notifications/Routes/notifications.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Employer/Routes/employer.php'));

            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('Modules/Messages/Routes/messages.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
