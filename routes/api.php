<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GeojsonController;

// Optional: expose region resources if needed
// Route::apiResource('regions', \App\Http\Controllers\RegionController::class);

// Main category API endpoint
Route::get('main-categories', function() {
    return response()->json([
        'main_categories' => [
            ['value' => 'RDTR', 'label' => 'RDTR (Rencana Detail Tata Ruang)'],
            ['value' => 'RTRW', 'label' => 'RTRW (Rencana Tata Ruang Wilayah)'],
            ['value' => 'KKPR', 'label' => 'KKPR (Kawasan Konservasi dan Perlindungan)'],
            ['value' => 'GANTI RUGI', 'label' => 'GANTI RUGI'],
        ]
    ]);
})->name('api.main-categories');


// Update GeoJSON properties via API (expects JSON body: { properties: { ... } })
Route::put('geojson/{id}/properties', [GeojsonController::class, 'updateProperties'])->name('api.geojson.properties.update');

