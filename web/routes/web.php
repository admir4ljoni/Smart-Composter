<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

// ponytail: UI mock routes with no props; slices 3–8 replace these with controllers.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('devices/{device}', fn (int $device) => Inertia::render('devices/show', ['deviceId' => $device]))
        ->whereNumber('device')
        ->name('devices.show');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::inertia('schools', 'admin/schools')->name('schools.index');
        Route::inertia('users', 'admin/users')->name('users.index');
        Route::inertia('devices', 'admin/devices')->name('devices.index');
    });

    Route::get('mock/error/{status}', fn (int $status) => Inertia::render('error', ['status' => $status]))
        ->whereIn('status', ['403', '404', '500', '503'])
        ->name('mock.error');
});

require __DIR__.'/settings.php';
