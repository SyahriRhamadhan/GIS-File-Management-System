<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Geojson;
use App\Models\Region;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $geojsons = Geojson::all();
        $regions = Region::all();
        $user = Auth::user();

        return Inertia::render('dashboard', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'user' => $user,
        ]);
    }
}
