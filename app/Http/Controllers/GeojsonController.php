<?php

namespace App\Http\Controllers;

use App\Models\Geojson;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Region;
use App\Models\Owner;
use App\Models\User;
use App\Models\Kategori;

class GeojsonController extends Controller
{
    public function index()
    {
        $geojsons = Geojson::all();
        $regions = Region::all();
        $users = User::all();
        $owners = Owner::all();
        $kategoris  = Kategori::all();

        return Inertia::render('geojson/index', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'users' => $users,
            'owners' => $owners,
            'kategoris' => $kategoris,
        ]);
    }

    public function create()
    {
        $user_name = Auth::user()->name;
        $regions = Region::all();
        $owners = Owner::all();
        $user_id = Auth::id();
        $kategoris  = Kategori::all();


        return Inertia::render('geojson/create', [
            'user_name' => $user_name,
            'regions' => $regions,
            'owner' => $owners,
            'user_id' => $user_id,
            'kategoris' => $kategoris,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'geojson'      => 'required_without:geojson_file|json',
            'geojson_file' => 'required_without:geojson|file|mimes:json,geojson',
            'id_user'      => 'required|exists:users,id',
            'id_region'    => 'nullable|exists:region,id_region',
            'id_owner'     => 'nullable|exists:owner,id_owner',
            'id_kategori'    => 'nullable|exists:kategori,id_kategori',
        ]);

        if ($request->hasFile('geojson_file')) {
            $file = $request->file('geojson_file');
            $geojson = json_decode(file_get_contents($file), true);
        } else {
            $geojson = json_decode($validated['geojson'], true);
        }
        $idRegion = $validated['id_region'] ?? null;
        $idOwner  = $validated['id_owner']  ?? null;
        $idKategori  = $validated['id_kategori']  ?? null;

        if (is_array($geojson) && isset($geojson[0]['type']) && $geojson[0]['type'] === 'FeatureCollection') {
            foreach ($geojson as $singleGeojson) {
                if ($singleGeojson['type'] !== 'FeatureCollection' || !isset($singleGeojson['features'])) {
                    return back()->withErrors(['geojson' => 'GeoJSON harus berupa FeatureCollection yang valid.']);
                }

                foreach ($singleGeojson['features'] as &$feature) {
                    $this->processCoordinates($feature);
                }

                foreach ($singleGeojson['features'] as $feature) {
                    Geojson::create([
                        'geojson' => $feature,
                        'source_name' => $singleGeojson['fileName'] ?? 'Geojson Upload',
                        'id_user' => $validated['id_user'],
                        'id_region'   => $idRegion,                    // bisa null
                        'id_owner'    => $idOwner,
                        'id_kategori' => $idKategori,
                    ]);
                }
            }
        } else {
            if ($geojson['type'] !== 'FeatureCollection' || !isset($geojson['features'])) {
                return back()->withErrors(['geojson' => 'GeoJSON harus berupa FeatureCollection.']);
            }

            foreach ($geojson['features'] as &$feature) {
                $this->processCoordinates($feature);
            }

            foreach ($geojson['features'] as $feature) {
                Geojson::create([
                    'geojson' => $feature,
                    'source_name' => $geojson['fileName'] ?? 'Geojson Upload',
                    'id_user' => $validated['id_user'],
                    'id_region'   => $idRegion,
                    'id_owner'    => $idOwner,
                    'id_kategori' => $idKategori,
                ]);
            }
        }

        return redirect()->route('dashboard.geojson.index')->with('success', 'Seluruh fitur berhasil disimpan sebagai record terpisah.');
    }

    private function processCoordinates(&$feature)
    {
        if ($feature['geometry']['type'] === 'Polygon') {
            $feature['geometry']['coordinates'] = array_map(function ($polygon) {
                return array_map(function ($coord) {
                    return array_slice($coord, 0, 2);
                }, $polygon);
            }, $feature['geometry']['coordinates']);
        } elseif ($feature['geometry']['type'] === 'MultiPolygon') {
            $feature['geometry']['coordinates'] = array_map(function ($polygon) {
                return array_map(function ($ring) {
                    return array_map(function ($coord) {
                        return array_slice($coord, 0, 2);
                    }, $ring);
                }, $polygon);
            }, $feature['geometry']['coordinates']);
        }
    }

    public function edit($id)
    {
        $geojson = Geojson::findOrFail($id);

        return Inertia::render('geojson/update', [
            'geojson'   => $geojson,
            'user_name' => Auth::user()->name,
            'user_id'   => Auth::id(),
            'regions'   => Region::all(),
            'owner'     => Owner::all(),
            'kategoris' => Kategori::all(),
            'flash'     => session('success') ? ['success' => session('success')] : null,
        ]);
    }


    public function update(Request $request, $id)
    {
        $geojsonModel = Geojson::findOrFail($id);

        $validated = $request->validate([
            'geojson'       => 'required_without:geojson_file|json',
            'geojson_file'  => 'required_without:geojson|file|mimes:json,geojson',
            'id_user'       => 'required|exists:users,id',
            'id_region'     => 'nullable|exists:region,id_region',
            'id_owner'      => 'nullable|exists:owner,id_owner',
            'id_kategori'   => 'nullable|exists:kategori,id_kategori',
        ]);

        // 1) Decode either uploaded file or raw JSON
        if ($request->hasFile('geojson_file')) {
            $raw = json_decode(file_get_contents($request->file('geojson_file')), true);
        } else {
            $raw = json_decode($validated['geojson'], true);
        }

        // 2) If it's a FeatureCollection, pick the first feature
        if (isset($raw['features']) && is_array($raw['features'])) {
            $feature = $raw['features'][0];
        } else {
            $feature = $raw;
        }

        // 3) Normalize coordinates exactly as in store()
        $this->processCoordinates($feature);

        // 4) Build up the data array
        $data = [
            'geojson'     => $feature,
            'id_user'     => $validated['id_user'],
            'id_region'   => $validated['id_region']   ?? null,
            'id_owner'    => $validated['id_owner']    ?? null,
            'id_kategori' => $validated['id_kategori'] ?? null,
        ];

        if (isset($raw['fileName']) && is_string($raw['fileName'])) {
            $data['source_name'] = $raw['fileName'];
        }

        // 6) Persist changes
        $geojsonModel->update($data);

        return redirect()
            ->route('dashboard.geojson.index')
            ->with('success', 'GeoJSON berhasil diperbarui.');
    }


    public function destroy($id)
    {
        Geojson::findOrFail($id)->delete();

        return redirect()
            ->route('dashboard.geojson.index')
            ->with('success', 'GeoJSON berhasil dihapus.');
    }
}
