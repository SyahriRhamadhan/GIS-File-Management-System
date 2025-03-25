<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RegionController;



Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn() => Inertia::render('dashboard'))->name('dashboard');

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/region', [RegionController::class, 'index'])->name('region.index');
        Route::get('/region/create', [RegionController::class, 'create'])->name('region.create');
        Route::post('/region', [RegionController::class, 'store'])->name('region.store');
        Route::get('/region/{id}', [RegionController::class, 'show'])->name('region.show');
        Route::get('/region/{id}/edit', [RegionController::class, 'edit'])->name('region.edit');
        Route::delete('/region/{id}', [RegionController::class, 'destroy'])->name('region.destroy');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
