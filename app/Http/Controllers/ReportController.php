<?php

namespace App\Http\Controllers;

use App\Models\{Report, Geojson, Region, Owner, Kategori};
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $reports = Report::with(['geojson.region', 'geojson.owner', 'geojson.kategori'])->get();
        
        return Inertia::render('report/index', [
            'reports' => $reports,
            'regions' => Region::select('id_region', 'name')->get(),
            'kategoris' => Kategori::select('id_kategori', 'orde0', 'orde1', 'orde2', 'orde3', 'orde4')->get(),
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

        return Inertia::render('report/create', [
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

    public function edit(Report $report)
    {
        return Inertia::render('report/update', [
            'report' => $report,
            'geojsons' => Geojson::select('id_geojson', 'source_name')->get(),
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $validated = $request->validate([
            'id_geojson' => 'required|exists:geojson,id_geojson',
            'file_path' => 'nullable|file|mimes:pdf|max:2048',
            'description' => 'nullable|string',
            'nomor' => 'required|string|max:255|unique:report,nomor,' . $report->id_report . ',id_report',
            'sifat' => 'required|string|max:255',
            'hal' => 'required|string|max:255',
            'kepada' => 'required|string|max:255',
        ]);

        if ($request->hasFile('file_path')) {
            $report->file_path = $request->file('file_path')->store('reports', 'public');
        }

        $report->fill($request->except('file_path'))->save();

        return redirect()->route('dashboard.report.index')->with('success', 'Report berhasil diperbarui.');
    }

    public function destroy(Report $report)
    {
        $report->delete();
        return redirect()->route('dashboard.report.index')->with('success', 'Report berhasil dihapus.');
    }
}
