<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Geojson;
use App\Models\Region;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Optional filter berdasarkan query param id atau ids (comma-separated)
        $idsParam = $request->query('ids');
        $idParam = $request->query('id');

        $selectedIds = [];
        if ($idsParam) {
            $selectedIds = collect(explode(',', $idsParam))
                ->map(fn($v) => trim($v))
                ->filter()
                ->map(fn($v) => (int) $v)
                ->all();
        } elseif ($idParam) {
            $selectedIds = [(int) $idParam];
        }

        $geojsonQuery = Geojson::with('kategori');
        if (!empty($selectedIds)) {
            $geojsonQuery->whereIn('id_geojson', $selectedIds);
        }

        $geojsons = $geojsonQuery->get()->map(function ($geojson) {
            if (is_string($geojson->geojson)) {
                $geojson->geojson = json_decode($geojson->geojson, true);
            }
            return $geojson;
        });

        $regions = Region::all();
        $user = Auth::user();

        return Inertia::render('dashboard', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'user' => $user,
            'selectedIds' => array_map('strval', $selectedIds),
        ]);
    }
}
