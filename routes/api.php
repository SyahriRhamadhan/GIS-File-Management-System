<?php

use App\Http\Controllers\Api\RegionController;
use Illuminate\Support\Facades\Route;

Route::apiResource('regions', \App\Http\Controllers\RegionController::class);


