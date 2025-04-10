<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\GeojsonController;

// Halaman utama
Route::get('/', fn() => Inertia::render('welcome'))->name('home');

// Hanya untuk pengguna yang sudah login & verifikasi
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Prefix: /dashboard
    Route::prefix('dashboard')->name('dashboard.')->group(function () {

        // --- REGION ROUTES ---
        Route::get('/region', [RegionController::class, 'index'])->name('region.index');
        Route::get('/region/create', [RegionController::class, 'create'])->name('region.create');
        Route::post('/region', [RegionController::class, 'store'])->name('region.store');
        Route::get('/region/{id}', [RegionController::class, 'show'])->name('region.show');
        Route::get('/region/{id}/edit', [RegionController::class, 'edit'])->name('region.edit');
        Route::put('/region/{id}', [RegionController::class, 'update'])->name('region.update');
        Route::delete('/region/{id}', [RegionController::class, 'destroy'])->name('region.destroy');

        // --- GEOJSON ROUTES ---
        Route::get('/geojson', [GeojsonController::class, 'index'])->name('geojson.index');
        Route::get('/geojson/create', [GeojsonController::class, 'create'])->name('geojson.create');
        Route::post('/geojson', [GeojsonController::class, 'store'])->name('geojson.store');
        Route::get('/geojson/{id}/edit', [GeojsonController::class, 'edit'])->name('geojson.edit');
        Route::put('/geojson/{id}', [GeojsonController::class, 'update'])->name('geojson.update');
        Route::delete('/geojson/{id}', [GeojsonController::class, 'destroy'])->name('geojson.destroy');
    });
});

// Route tambahan
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
