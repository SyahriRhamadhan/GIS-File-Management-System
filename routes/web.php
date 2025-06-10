<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\GeojsonController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\PdfGeojson;
// Halaman utama
Route::get('/', fn() => Inertia::render('welcome'))->name('home');


// Hanya untuk pengguna yang sudah login & verifikasi
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/convert-shp', fn() => Inertia::render('ShpToGeojson'))->name('ShpToGeojson');
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

        // --- PDF ROUTES ---
        Route::get('/tambah-pdf', [ReportController::class, 'index'])->name('report.index');
        Route::get('/tambah-pdf/create', [ReportController::class, 'create'])->name('report.create');
        Route::post('/tambah-pdf', [ReportController::class, 'store'])->name('report.store');
        Route::get('/tambah-pdf/{id}/edit', [ReportController::class, 'edit'])->name('report.edit');
        Route::put('/tambah-pdf/{id}', [ReportController::class, 'update'])->name('report.update');
        Route::delete('/tambah-pdf/{id}', [ReportController::class, 'destroy'])->name('report.destroy');

        // --- KATEGORI ROUTES ---
        Route::get('/kategori', [KategoriController::class, 'index'])->name('kategori.index');
        Route::get('/kategori/create', [KategoriController::class, 'create'])->name('kategori.create');
        Route::post('/kategori', [KategoriController::class, 'store'])->name('kategori.store');
        Route::get('/kategori/{id}/edit', [KategoriController::class, 'edit'])->name('kategori.edit');
        Route::put('/kategori/{id}', [KategoriController::class, 'update'])->name('kategori.update');
        Route::delete('/kategori/{id}', [KategoriController::class, 'destroy'])->name('kategori.destroy');

        // --- PDF GEOJSON ---
        Route::get('/geojson/{id}/add', [PdfGeojson::class, 'createFromGeojson'])
            ->name('geojson.add_pdf');
    });
});

// Route tambahan
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
