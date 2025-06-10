<?php
// app/Http/Controllers/PdfGeojson.php
namespace App\Http\Controllers;

use App\Models\{Report, Geojson, Region, Owner};
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PdfGeojson  extends Controller
{
    public function createFromGeojson($id)
    {
        $geojson = Geojson::findOrFail($id);
        if (is_string($geojson->geojson)) {
            $geojson->geojson = json_decode($geojson->geojson, true);
        }

        $regions = Region::all();
        $user = Auth::user();

        return Inertia::render('pdf/create', [
            'geojsonSelected' => $geojson,
            'regions' => $regions,
            'user' => $user,
        ]);
    }

    public function create()
    {
        $geojsons = Geojson::with(['region', 'owner'])
            ->latest()
            ->get()
            ->map(fn($item) => [
                'id_geojson' => $item->id_geojson,
                'source_name' => $item->source_name,
                'region_name' => $item->region->name ?? '-',
                'owner_name' => $item->owner->name ?? '-',
            ]);

        return Inertia::render('pdf/create', [
            'geojsons' => $geojsons,
            'regions' => Region::select('id_region', 'name')->get(),
            'owners' => Owner::select('id_owner', 'name')->get(),
            'user_id' => Auth::id(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'file_path' => 'required|file|mimes:pdf|max:2048',
            'description' => 'nullable|string',
            'nomor' => 'required|string|max:255|unique:report,nomor',
            'sifat' => 'required|string|max:255',
            'hal' => 'required|string|max:255',
            'kepada' => 'required|string|max:255',
            'id_geojson' => 'nullable|exists:geojson,id_geojson',
            'geojson_file' => 'nullable|file|mimes:json,geojson,txt',
            'geojson_text' => 'nullable|string',
            'id_user' => 'required_without:id_geojson|exists:users,id',
            'id_region' => 'required_without:id_geojson|exists:region,id_region',
            'id_owner' => 'required_without:id_geojson|exists:owner,id_owner',
        ]);

        $geojsonId = $request->id_geojson;

        if (!$geojsonId) {
            $raw = $request->hasFile('geojson_file')
                ? file_get_contents($request->file('geojson_file'))
                : $request->geojson_text;

            $geojson = json_decode($raw, true);

            if (
                json_last_error() !== JSON_ERROR_NONE ||
                !isset($geojson['type'], $geojson['features']) ||
                $geojson['type'] !== 'FeatureCollection' ||
                !is_array($geojson['features'])
            ) {
                return back()->withErrors(['geojson' => 'GeoJSON harus berupa FeatureCollection dengan daftar fitur.']);
            }

            foreach ($geojson['features'] as &$feature) {
                if ($feature['geometry']['type'] === 'Polygon') {
                    $feature['geometry']['coordinates'] = array_map(
                        fn($polygon) => array_map(fn($coord) => array_slice($coord, 0, 2), $polygon),
                        $feature['geometry']['coordinates']
                    );
                } elseif ($feature['geometry']['type'] === 'MultiPolygon') {
                    $feature['geometry']['coordinates'] = array_map(
                        fn($polygon) => array_map(
                            fn($ring) => array_map(fn($coord) => array_slice($coord, 0, 2), $ring),
                            $polygon
                        ),
                        $feature['geometry']['coordinates']
                    );
                }
            }

            $geojsonIds = collect($geojson['features'])->map(function ($feature) use ($geojson, $request) {
                return Geojson::create([
                    'geojson' => $feature,
                    'source_name' => $geojson['name'] ?? 'Geojson Upload',
                    'id_user' => $request->id_user,
                    'id_region' => $request->id_region,
                    'id_owner' => $request->id_owner,
                ])->id_geojson;
            });

            $geojsonId = $geojsonIds->first();
        }

        $pdfPath = $request->file('file_path')->store('reports', 'public');

        Report::create([
            'id_geojson' => $geojsonId,
            'file_path' => $pdfPath,
            'description' => $request->description,
            'nomor' => $request->nomor,
            'sifat' => $request->sifat,
            'hal' => $request->hal,
            'kepada' => $request->kepada,
        ]);

        return redirect()->route('dashboard.report.index')->with('success', 'Laporan dan GeoJSON berhasil disimpan.');
    }
}
