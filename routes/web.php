<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\GeojsonController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn() => Inertia::render('dashboard'))->name('dashboard');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/region', [RegionController::class, 'index'])->name('region.index');
        Route::get('/region/create', [RegionController::class, 'create'])->name('region.create');
        Route::post('/region', [RegionController::class, 'store'])->name('region.store');
        Route::get('/region/{id}', [RegionController::class, 'show'])->name('region.show');
        Route::get('/region/{id}/edit', [RegionController::class, 'edit'])->name('region.edit');
        Route::delete('/region/{id}', [RegionController::class, 'destroy'])->name('region.destroy');
    });

    // Rute untuk daftar geojson (Index)
    Route::get('/dashboard/geojson', [GeojsonController::class, 'index'])->name('geojson.index');

    // Rute untuk membuat geojson baru
    Route::get('/dashboard/geojson/create', [GeojsonController::class, 'create'])->name('geojson.create');
    Route::post('/dashboard/geojson', [GeojsonController::class, 'store'])->name('geojson.store');

    // Rute untuk mengedit geojson
    Route::get('/dashboard/geojson/{id}/edit', [GeojsonController::class, 'edit'])->name('geojson.edit');
    Route::put('/dashboard/geojson/{id}', [GeojsonController::class, 'update'])->name('geojson.update');

    // Rute untuk menghapus geojson
    Route::delete('/dashboard/geojson/{id}', [GeojsonController::class, 'destroy'])->name('geojson.destroy');;
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
