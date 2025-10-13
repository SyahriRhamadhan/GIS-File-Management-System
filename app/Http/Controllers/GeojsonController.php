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

    public function getGeojsonData($id)
    {
        $geojson = Geojson::with(['region', 'owner'])->findOrFail($id);
        
        // Ensure geojson data is properly formatted
        $geojsonData = $geojson->geojson;
        if (is_string($geojsonData)) {
            $geojsonData = json_decode($geojsonData, true);
        }

        return response()->json([
            'id_geojson' => $geojson->id_geojson,
            'source_name' => $geojson->source_name,
            'region_name' => $geojson->region->name ?? '-',
            'owner_name' => $geojson->owner->name ?? '-',
            'geojson' => $geojsonData
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'geojson'        => 'required_without_all:geojson_file|json',
            'geojson_file'   => 'nullable|array',
            'geojson_file.*' => [
                'file',
                'mimetypes:application/json,application/geo+json,text/plain,application/octet-stream',
            ],
            'id_user'      => 'required|exists:users,id',
            'id_region'    => 'nullable|exists:region,id_region',
            'id_owner'     => 'nullable|exists:owner,id_owner',
            'id_kategori'  => 'nullable|exists:kategori,id_kategori',
        ]);

        $idUser     = $validated['id_user'];
        $idRegion   = $validated['id_region']   ?? null;
        $idOwner    = $validated['id_owner']    ?? null;
        $idKategori = $validated['id_kategori'] ?? null;

        $uploadErrors = [];

        // 1) Jika ada file(s)
        if (! empty($validated['geojson_file'])) {
            foreach ($validated['geojson_file'] as $file) {
                $fileName = $file->getClientOriginalName();
                $raw      = @json_decode(file_get_contents($file), true);

                if (! is_array($raw) || ! isset($raw['features']) || ! is_array($raw['features'])) {
                    $uploadErrors[] = "File “{$fileName}” bukan FeatureCollection yang valid.";
                    continue;
                }

                $sourceName = $raw['fileName'] ?? $fileName;
                foreach ($raw['features'] as $feature) {
                    try {
                        $this->processCoordinates($feature);
                        Geojson::create([
                            'geojson'     => $feature,
                            'source_name' => $sourceName,
                            'id_user'     => $idUser,
                            'id_region'   => $idRegion,
                            'id_owner'    => $idOwner,
                            'id_kategori' => $idKategori,
                        ]);
                    } catch (\Throwable $e) {
                        $uploadErrors[] = "Gagal menyimpan fitur di “{$fileName}”: " . $e->getMessage();
                    }
                }
            }
        }
        // 2) Kalau tidak ada file, pakai GeoJSON teks
        else {
            $raw        = @json_decode($validated['geojson'], true);
            $sourceName = $raw['fileName'] ?? 'Geojson Upload (Text)';

            if (! is_array($raw) || ! isset($raw['features']) || ! is_array($raw['features'])) {
                return back()
                    ->withInput()
                    ->withErrors(['geojson' => 'JSON teks harus FeatureCollection yang valid.']);
            }

            foreach ($raw['features'] as $i => $feature) {
                try {
                    $this->processCoordinates($feature);
                    Geojson::create([
                        'geojson'     => $feature,
                        'source_name' => $sourceName,
                        'id_user'     => $idUser,
                        'id_region'   => $idRegion,
                        'id_owner'    => $idOwner,
                        'id_kategori' => $idKategori,
                    ]);
                } catch (\Throwable $e) {
                    $uploadErrors[] = "Gagal fitur ke-" . ($i + 1) . ": " . $e->getMessage();
                }
            }
        }

        // kalau ada uploadErrors, kirim sebagai flash.upload_errors
        if (! empty($uploadErrors)) {
            return back()
                ->with('flash', ['upload_errors' => $uploadErrors])
                ->with('success', 'Sebagian file berhasil diupload, beberapa gagal.');
        }

        return redirect()
            ->route('dashboard.geojson.index')
            ->with('success', 'Semua fitur berhasil disimpan.');
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
