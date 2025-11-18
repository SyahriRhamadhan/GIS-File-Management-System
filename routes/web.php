<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Geojson;
use App\Models\Region;
use App\Models\PewarnaanRdtr;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\GeojsonController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\OwnerController;
use App\Http\Controllers\PdfGeojson;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PewarnaanRdtrController;
// Halaman utama
Route::get('/', function () {
    $geojsons = Geojson::with('kategori')
        ->select([
            'geojson.id_geojson',
            'geojson.source_name',
            'geojson.main_category',
            'geojson.id_kategori',
            'geojson.geojson',
            'geojson.geojson_bbox',
        ])
        ->orderByDesc('geojson.created_at')
        ->limit(500)
        ->get();

    $bySubZona = [];
    $byKode = [];
    foreach (PewarnaanRdtr::select('kode', 'sub_zona', 'kode_warna', 'rgb')->get() as $r) {
        $hex = $r->kode_warna;
        if (empty($hex) && is_string($r->rgb)) {
            $parts = preg_split('/\s+/', trim($r->rgb));
            if (count($parts) === 3) {
                $rC = max(0, min(255, (int) $parts[0]));
                $gC = max(0, min(255, (int) $parts[1]));
                $bC = max(0, min(255, (int) $parts[2]));
                $hex = sprintf('#%02x%02x%02x', $rC, $gC, $bC);
            }
        }
        if ($hex) {
            if (!empty($r->sub_zona)) {
                $bySubZona[trim((string) $r->sub_zona)] = $hex;
            }
            if (!empty($r->kode)) {
                $byKode[trim((string) $r->kode)] = $hex;
            }
        }
    }

    $geojsons = $geojsons->map(function ($g) use ($bySubZona, $byKode) {
        $feature = $g->getRawOriginal('geojson');
        if (is_string($feature)) {
            $decoded = json_decode($feature, true);
            $feature = is_array($decoded) ? $decoded : ['type' => 'Feature', 'properties' => []];
        } elseif (!is_array($feature)) {
            $feature = ['type' => 'Feature', 'properties' => []];
        }
        if (!isset($feature['properties']) || !is_array($feature['properties'])) {
            $feature['properties'] = [];
        }

        $color = $g->kategori->kode_warna ?? null;
        if (!$color || $color === '#3388ff') {
            $props = $feature['properties'] ?? [];
            $namobj = $props['NAMOBJ'] ?? null;
            $kodunk = $props['KODUNK'] ?? null;
            if ($namobj && isset($bySubZona[$namobj])) {
                $color = $bySubZona[$namobj];
            } elseif ($kodunk && is_string($kodunk)) {
                if (preg_match('/^([A-Z0-9\-]+)/', $kodunk, $m)) {
                    $prefix = $m[1];
                    if (isset($byKode[$prefix])) {
                        $color = $byKode[$prefix];
                    }
                }
            }
        }
        if (!$color) {
            $color = '#3388ff';
        }

        return [
            'id_geojson' => $g->id_geojson,
            'source_name' => $g->source_name,
            'main_category' => $g->main_category,
            'id_kategori' => $g->id_kategori,
            'kategori' => $g->kategori ? [
                'layer_order' => $g->kategori->layer_order,
                'orde0' => $g->kategori->orde0,
                'kode_warna' => $g->kategori->kode_warna,
                'kode' => $g->kategori->kode,
            ] : null,
            'geojson' => $feature,
            'geojson_bbox' => $g->geojson_bbox,
            'kode_warna' => $color,
        ];
    });

    $regions = Region::select('id_region', 'name')->get();

    return Inertia::render('welcome', [
        'geojsons' => $geojsons,
        'regions' => $regions,
        'user' => null,
    ]);
})->name('home');

// Public API for landing page map
Route::get('/api/public/geojsons', [DashboardController::class, 'getGeojsons'])->name('api.public.geojsons');
Route::get('/api/public/geojsons/{geojson}', [DashboardController::class, 'showGeojson'])->name('api.public.geojson.show');


// Hanya untuk pengguna yang sudah login & verifikasi
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/convert-shp', fn() => Inertia::render('ShpToGeojson'))->name('ShpToGeojson');
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Dashboard API endpoints for lazy loading
    Route::get('/api/dashboard/geojsons', [DashboardController::class, 'getGeojsons'])->name('api.dashboard.geojsons');
    Route::get('/api/dashboard/geojsons/{geojson}', [DashboardController::class, 'showGeojson'])->name('api.dashboard.geojson.show');
    Route::get('/api/dashboard/categories', [DashboardController::class, 'getCategories'])->name('api.dashboard.categories');

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
        Route::get('/api/geojson/{id}/data', [GeojsonController::class, 'getGeojsonData'])->name('geojson.data');
        // Update only properties from popup/editor
        Route::put('/geojson/{id}/properties', [GeojsonController::class, 'updateProperties'])->name('geojson.properties.update');
        // Sync storage files to DB
        Route::get('/geojson/sync-storage', [GeojsonController::class, 'syncStorage'])->name('geojson.sync_storage');

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

        // --- OWNER ROUTES ---
        Route::post('/owner', [OwnerController::class, 'store'])->name('owner.store');

        // --- USER MANAGEMENT ROUTES ---
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete'])->name('users.bulk-delete');
        Route::post('/users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
        Route::delete('/users/{user}/force-delete', [UserController::class, 'forceDelete'])->name('users.force-delete');

        // --- PDF GEOJSON ---
        Route::get('/geojson/{id}/add', [PdfGeojson::class, 'createFromGeojson'])
            ->name('geojson.add_pdf');
        Route::get('/geojson/{id}/view', [PdfGeojson::class, 'index'])
            ->name('geojson.list_pdf');

        // --- PEWARNAAN RDTR ROUTES ---
        Route::get('/pewarnaan-rdtr', [PewarnaanRdtrController::class, 'index'])->name('pewarnaan_rdtr.index');
        Route::get('/pewarnaan-rdtr/create', [PewarnaanRdtrController::class, 'create'])->name('pewarnaan_rdtr.create');
        Route::post('/pewarnaan-rdtr', [PewarnaanRdtrController::class, 'store'])->name('pewarnaan_rdtr.store');
        Route::get('/pewarnaan-rdtr/{id}/edit', [PewarnaanRdtrController::class, 'edit'])->name('pewarnaan_rdtr.edit');
        Route::put('/pewarnaan-rdtr/{id}', [PewarnaanRdtrController::class, 'update'])->name('pewarnaan_rdtr.update');
        Route::delete('/pewarnaan-rdtr/{id}', [PewarnaanRdtrController::class, 'destroy'])->name('pewarnaan_rdtr.destroy');
    });
});

// Route tambahan
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
