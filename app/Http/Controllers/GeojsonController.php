<?php

namespace App\Http\Controllers;

use App\Models\Geojson;
use Illuminate\Http\Request;
use Inertia\Inertia;
// use Illuminate\Support\Facades\Auth;
use App\Models\Region;
use App\Models\Owner;
use App\Models\User;
use App\Models\Kategori;
use App\Models\PewarnaanRdtr;
use App\Http\Requests\StoreGeojsonRequest;
use App\Http\Requests\UpdateGeojsonRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class GeojsonController extends Controller
{
    public function index(Request $request)
    {
        // Get pagination parameters
        $perPage = $request->input('per_page', 10);
        if ($perPage === 'all') {
            $perPage = Geojson::count();
        }

        // Get filter parameters
        $search = $request->input('search', '');
        $userFilter = $request->input('user_filter', '');
        $regionFilter = $request->input('region_filter', '');
        $ownerFilter = $request->input('owner_filter', '');
        $categoryFilter = $request->input('category_filter', '');
        $sourceFilter = $request->input('source_filter', '');
        $mainCategoryFilter = $request->input('main_category_filter', '');

        // Get sorting parameters
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc'); // biasanya terbaru di atas

        // Build query with relationships
        $query = Geojson::with(['region', 'owner'])
            ->leftJoin('users', 'geojson.id_user', '=', 'users.id')
            ->leftJoin('region', 'geojson.id_region', '=', 'region.id_region')
            ->leftJoin('owner', 'geojson.id_owner', '=', 'owner.id_owner')
            ->leftJoin('kategori', 'geojson.id_kategori', '=', 'kategori.id_kategori')
            ->select('geojson.*');

        // Apply filters
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('geojson.source_name', 'ilike', "%{$search}%")
                  ->orWhere('users.name', 'ilike', "%{$search}%")
                  ->orWhere('region.name', 'ilike', "%{$search}%")
                  ->orWhere('owner.name', 'ilike', "%{$search}%")
                  ->orWhere('kategori.orde0', 'ilike', "%{$search}%")
                  ->orWhere('kategori.orde1', 'ilike', "%{$search}%")
                  ->orWhere('kategori.orde2', 'ilike', "%{$search}%")
                  ->orWhere('kategori.orde3', 'ilike', "%{$search}%")
                  ->orWhere('kategori.orde4', 'ilike', "%{$search}%");
            });
        }

        if (!empty($userFilter)) {
            $query->where('geojson.id_user', $userFilter);
        }

        if (!empty($regionFilter)) {
            $query->where('geojson.id_region', $regionFilter);
        }

        if (!empty($ownerFilter)) {
            $query->where('geojson.id_owner', $ownerFilter);
        }

        if (!empty($categoryFilter)) {
            $query->where('geojson.id_kategori', $categoryFilter);
        }

        if (!empty($sourceFilter)) {
            $query->where('geojson.source_name', $sourceFilter);
        }

        if (!empty($mainCategoryFilter)) {
            $query->where('geojson.main_category', $mainCategoryFilter);
        }

        // Apply sorting
        $allowedSortFields = ['source_name', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy("geojson.{$sortBy}", $sortDirection);
        } else {
            $query->orderBy('geojson.source_name', 'asc');
        }

        // Get paginated results
        $geojsons = $query->paginate($perPage)
            ->appends($request->except('page'));

        $rdtr = PewarnaanRdtr::select('kode','sub_zona','kode_warna','rgb')->get();
        $bySubZona = [];
        $byKode = [];
        foreach ($rdtr as $r) {
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
        $geojsons->setCollection(
            $geojsons->getCollection()->map(function ($item) use ($bySubZona, $byKode) {
                $color = $item->kode_warna;
                if (empty($color)) {
                    $data = $item->geojson;
                    if (is_string($data)) {
                        $data = json_decode($data, true);
                    }
                    if (is_array($data)) {
                        $props = $data['properties'] ?? [];
                        $namobj = is_array($props) ? (isset($props['NAMOBJ']) ? trim((string) $props['NAMOBJ']) : null) : null;
                        $kodunk = is_array($props) ? ($props['KODUNK'] ?? null) : null;
                        if ($namobj && isset($bySubZona[$namobj])) {
                            $color = $bySubZona[$namobj];
                        } elseif ($kodunk && is_string($kodunk)) {
                            $m = [];
                            if (preg_match('/^([A-Z0-9\-]+)/', $kodunk, $m)) {
                                $prefix = $m[1];
                                if (isset($byKode[$prefix])) {
                                    $color = $byKode[$prefix];
                                }
                            }
                        }
                    }
                }
                $item->kode_warna = $color ?: '#3388ff';
                return $item;
            })
        );

        // Get all data for filters
        $regions = Region::all();
        $users = User::all();
        $owners = Owner::all();
        $kategoris = Kategori::all();

        // Get unique source names for filter dropdown
        $sourceNames = Geojson::select('source_name')
            ->distinct()
            ->whereNotNull('source_name')
            ->orderBy('source_name')
            ->pluck('source_name');

        // Get main categories
        $mainCategories = [
            ['value' => 'RDTR', 'label' => 'RDTR (Rencana Detail Tata Ruang)'],
            ['value' => 'RTRW', 'label' => 'RTRW (Rencana Tata Ruang Wilayah)'],
            ['value' => 'KKPR', 'label' => 'KKPR (Kawasan Konservasi dan Perlindungan)'],
            ['value' => 'GANTI RUGI', 'label' => 'GANTI RUGI'],
        ];

        return Inertia::render('geojson/index', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'users' => $users,
            'owners' => $owners,
            'kategoris' => $kategoris,
            'sourceNames' => $sourceNames,
            'mainCategories' => $mainCategories,
            'filters' => [
                'search' => $search,
                'user_filter' => $userFilter,
                'region_filter' => $regionFilter,
                'owner_filter' => $ownerFilter,
                'category_filter' => $categoryFilter,
                'source_filter' => $sourceFilter,
                'main_category_filter' => $mainCategoryFilter,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $request->input('per_page', 10),
            ],
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

        $geojsonData = null;
        if ($geojson->geojson_path && \Illuminate\Support\Facades\Storage::exists($geojson->geojson_path)) {
            $geojsonData = json_decode(\Illuminate\Support\Facades\Storage::get($geojson->geojson_path), true);
        }
        if (!$geojsonData) {
            $geojsonData = $geojson->geojson;
            if (is_string($geojsonData)) {
                $geojsonData = json_decode($geojsonData, true);
            }
        }

        return response()->json([
            'id_geojson' => $geojson->id_geojson,
            'source_name' => $geojson->source_name,
            'region_name' => $geojson->region->name ?? '-',
            'owner_name' => $geojson->owner->name ?? '-',
            'geojson' => $geojsonData
        ]);
    }

    public function store(StoreGeojsonRequest $request)
    {
        $validated = $request->validated();

        $idUser        = $validated['id_user'];
        $idRegion      = $validated['id_region']      ?? null;
        $idOwner       = $validated['id_owner']       ?? null;
        $idKategori    = $validated['id_kategori']    ?? null;
        $mainCategory  = $validated['main_category']  ?? null;

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
                    $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
                    $featureSource =
                        $properties['__source_filename'] ??
                        $properties['source_name'] ??
                        $sourceName;
                    if (isset($feature['properties']) && is_array($feature['properties'])) {
                        unset($feature['properties']['__source_filename'], $feature['properties']['source_name']);
                    }
                    try {
                        $this->processCoordinates($feature);
                        $metadata = $this->extractMetadataFromFeature($feature);
                        $created = Geojson::create([
                            'geojson'        => ['__stored_in_file' => true],
                            'source_name'    => $featureSource,
                            'id_user'        => $idUser,
                            'id_region'      => $idRegion,
                            'id_owner'       => $idOwner,
                            'id_kategori'    => $idKategori,
                            'main_category'  => $mainCategory,
                            'properties_snapshot' => $metadata['properties_snapshot'],
                            'geojson_bbox' => $metadata['geojson_bbox'],
                        ]);
                        try {
                            $dir = 'geojson/features';
                            Storage::makeDirectory($dir);
                            $path = $dir.'/'.($created->id_geojson).'.json';
                            Storage::put($path, json_encode($feature));
                            $size = Storage::size($path) ?: null;
                            $created->update([
                                'geojson_path' => $path,
                                'geojson_size' => $size,
                            ]);
                        } catch (\Throwable $e) {
                            // Ignore file persist errors; DB still has blob
                        }
                    } catch (\Throwable $e) {
                        $uploadErrors[] = "Gagal menyimpan fitur di \"{$fileName}\": " . $e->getMessage();
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
                $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
                $featureSource =
                    $properties['__source_filename'] ??
                    $properties['source_name'] ??
                    $sourceName;
                if (isset($feature['properties']) && is_array($feature['properties'])) {
                    unset($feature['properties']['__source_filename'], $feature['properties']['source_name']);
                }
                try {
                    $this->processCoordinates($feature);
                    $metadata = $this->extractMetadataFromFeature($feature);
                    $created = Geojson::create([
                        'geojson'        => ['__stored_in_file' => true],
                        'source_name'    => $featureSource,
                        'id_user'        => $idUser,
                        'id_region'      => $idRegion,
                        'id_owner'       => $idOwner,
                        'id_kategori'    => $idKategori,
                        'main_category'  => $mainCategory,
                        'properties_snapshot' => $metadata['properties_snapshot'],
                        'geojson_bbox' => $metadata['geojson_bbox'],
                    ]);
                    try {
                        $dir = 'geojson/features';
                        Storage::makeDirectory($dir);
                        $path = $dir.'/'.($created->id_geojson).'.json';
                        Storage::put($path, json_encode($feature));
                        $size = Storage::size($path) ?: null;
                        $created->update([
                            'geojson_path' => $path,
                            'geojson_size' => $size,
                        ]);
                    } catch (\Throwable $e) {
                        // Ignore file persist errors
                    }
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

    private function calculateBoundingBox(?array $geometry): ?array
    {
        if (!is_array($geometry) || !isset($geometry['coordinates'])) {
            return null;
        }

        $minLng = $minLat = $maxLng = $maxLat = null;

        $flatten = function ($coords) use (&$flatten, &$minLng, &$minLat, &$maxLng, &$maxLat) {
            if (!is_array($coords)) {
                return;
            }

            if (isset($coords[0]) && is_numeric($coords[0]) && isset($coords[1]) && is_numeric($coords[1])) {
                $lng = (float) $coords[0];
                $lat = (float) $coords[1];
                $minLng = $minLng === null ? $lng : min($minLng, $lng);
                $maxLng = $maxLng === null ? $lng : max($maxLng, $lng);
                $minLat = $minLat === null ? $lat : min($minLat, $lat);
                $maxLat = $maxLat === null ? $lat : max($maxLat, $lat);
                return;
            }

            foreach ($coords as $child) {
                $flatten($child);
            }
        };

        $flatten($geometry['coordinates']);

        if ($minLng === null || $minLat === null || $maxLng === null || $maxLat === null) {
            return null;
        }

        return [
            'min_lng' => $minLng,
            'min_lat' => $minLat,
            'max_lng' => $maxLng,
            'max_lat' => $maxLat,
        ];
    }

    private function extractMetadataFromFeature(array $feature): array
    {
        $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
        if (isset($feature['properties']) && is_array($feature['properties'])) {
            $properties = $feature['properties'];
        }

        $bbox = null;
        if (isset($feature['bbox']) && is_array($feature['bbox']) && count($feature['bbox']) === 4) {
            $bbox = [
                'min_lng' => (float) $feature['bbox'][0],
                'min_lat' => (float) $feature['bbox'][1],
                'max_lng' => (float) $feature['bbox'][2],
                'max_lat' => (float) $feature['bbox'][3],
            ];
        } else {
            $bbox = $this->calculateBoundingBox($feature['geometry'] ?? null);
        }

        return [
            'properties_snapshot' => $properties,
            'geojson_bbox' => $bbox,
        ];
    }

    public function edit($id)
    {
        $geojson = Geojson::findOrFail($id);
        try {
            if ($geojson->geojson_path && \Illuminate\Support\Facades\Storage::exists($geojson->geojson_path)) {
                $decoded = json_decode(\Illuminate\Support\Facades\Storage::get($geojson->geojson_path), true);
                if ($decoded) {
                    $geojson->geojson = $decoded;
                }
            }
        } catch (\Throwable $e) {
        }

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


    public function update(UpdateGeojsonRequest $request, $id)
    {
        $geojsonModel = Geojson::findOrFail($id);

        $validated = $request->validated();

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
        $metadata = $this->extractMetadataFromFeature($feature);

        // 4) Build up the data array
        $data = [
            'geojson'        => ['__stored_in_file' => true],
            'id_user'        => $validated['id_user'],
            'id_region'      => $validated['id_region']      ?? null,
            'id_owner'       => $validated['id_owner']       ?? null,
            'id_kategori'    => $validated['id_kategori']    ?? null,
            'main_category'  => $validated['main_category']  ?? null,
            'properties_snapshot' => $metadata['properties_snapshot'],
            'geojson_bbox' => $metadata['geojson_bbox'],
        ];

        // 5) Handle source_name - prioritize form data over fileName from GeoJSON
        if (!empty($validated['source_name'])) {
            $data['source_name'] = $validated['source_name'];
        } elseif (isset($raw['fileName']) && is_string($raw['fileName'])) {
            $data['source_name'] = $raw['fileName'];
        }

        // 6) Persist changes
        $geojsonModel->update($data);
        try {
            $dir = 'geojson/features';
            $path = $geojsonModel->geojson_path ?: ($dir.'/'.($geojsonModel->id_geojson).'.json');
            Storage::put($path, json_encode($feature));
            $size = Storage::size($path) ?: null;
            $geojsonModel->update([
                'geojson_path' => $path,
                'geojson_size' => $size,
            ]);
        } catch (\Throwable $e) {
            // Ignore file persist errors
        }

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

    /**
     * Delete multiple GeoJSON records in one request.
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:geojson,id_geojson'],
        ]);

        $ids = array_unique($validated['ids']);
        $deleted = Geojson::whereIn('id_geojson', $ids)->delete();

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'deleted' => $deleted,
                'ids' => $ids,
            ]);
        }

        return redirect()
            ->route('dashboard.geojson.index')
            ->with('success', "{$deleted} GeoJSON berhasil dihapus.");
    }

    /**
     * Update only the properties object inside stored GeoJSON.
     * Accepts: { properties: { key: value, ... } }
     * Returns JSON on API calls, or redirects back with flash on web calls.
     */
    public function updateProperties(Request $request, $id)
    {
        $validated = $request->validate([
            'properties' => 'required|array',
        ]);

        $geo = Geojson::findOrFail($id);

        $feature = null;
        if ($geo->geojson_path && Storage::exists($geo->geojson_path)) {
            $feature = json_decode(Storage::get($geo->geojson_path), true) ?: [];
        }
        if (!is_array($feature)) {
            $feature = $geo->geojson;
            if (is_string($feature)) {
                $feature = json_decode($feature, true) ?: [];
            }
        }
        if (!is_array($feature)) {
            $feature = [];
        }

        $currentProps = $feature['properties'] ?? [];
        if (!is_array($currentProps)) {
            $currentProps = [];
        }

        $newProps = $validated['properties'];
        if (!is_array($newProps)) {
            $newProps = [];
        }

        // Preserve special keys that should never be edited (e.g. id_geojson) unless explicitly provided
        foreach (['id_geojson'] as $protectedKey) {
            if (array_key_exists($protectedKey, $currentProps) && !array_key_exists($protectedKey, $newProps)) {
                $newProps[$protectedKey] = $currentProps[$protectedKey];
            }
        }

        $feature['properties'] = $newProps;

        $geo->fill([
            'geojson' => ['__stored_in_file' => true],
            'properties_snapshot' => $newProps,
        ]);
        $geo->save();
        try {
            if ($geo->geojson_path) {
                $dir = dirname($geo->geojson_path);
                Storage::makeDirectory($dir);
                Storage::put($geo->geojson_path, json_encode($feature));
                $geo->update(['geojson_size' => Storage::size($geo->geojson_path) ?: null]);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Properties updated',
                'geojson' => $geo,
            ]);
        }

        return back()->with('success', 'Properties berhasil diperbarui.');
    }

    /**
     * Rename a source_name group that is used as the tree parent label.
     * Accepts payload: { old_name: string, new_name: string }
     */
    public function renameSourceGroup(Request $request)
    {
        $validated = $request->validate([
            'old_name' => 'required|string|max:255',
            'new_name' => 'required|string|max:255|different:old_name',
        ]);

        $oldName = trim($validated['old_name']);
        $newName = trim($validated['new_name']);

        if ($oldName === '' || $newName === '') {
            $message = 'Nama sumber tidak boleh kosong.';
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['message' => $message], 422);
            }
            return back()->withErrors(['new_name' => $message])->withInput();
        }

        if ($oldName === $newName) {
            $message = 'Nama sumber baru harus berbeda dari nama sebelumnya.';
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['message' => $message], 422);
            }
            return back()->withErrors(['new_name' => $message])->withInput();
        }

        $query = Geojson::where('source_name', $oldName);
        $count = (clone $query)->count();

        if ($count === 0) {
            $message = 'Nama sumber tidak ditemukan.';
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['message' => $message], 404);
            }
            return back()->withErrors(['old_name' => $message])->withInput();
        }

        $query->update(['source_name' => $newName]);

        $payload = [
            'message' => "Nama sumber diperbarui dari '{$oldName}' menjadi '{$newName}'.",
            'updated' => $count,
            'old_name' => $oldName,
            'new_name' => $newName,
        ];

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json($payload);
        }

        return back()->with('success', $payload['message']);
    }

    /**
     * Utility: Sinkronisasi file fitur di storage ke DB jika baris hilang.
     * GET /dashboard/geojson/sync-storage
     */
    public function syncStorage()
    {
        $paths = array_merge(
            Storage::exists('geojson/features') ? Storage::files('geojson/features') : [],
            Storage::exists('private/geojson/features') ? Storage::files('private/geojson/features') : []
        );

        $createdCount = 0;
        $userId = Auth::id();
        if (!$userId) {
            $userId = DB::table('users')->value('id') ?: null;
        }

        foreach ($paths as $path) {
            if (!str_ends_with($path, '.json')) continue;
            $filename = basename($path);
            $idStr = preg_replace('/\.json$/', '', $filename);
            $id = (int) $idStr;
            if ($id <= 0) continue;

            $exists = Geojson::where('id_geojson', $id)->exists();
            if ($exists) continue;

            $size = null;
            $feature = null;
            try {
                $size = Storage::size($path) ?: null;
                $feature = json_decode(Storage::get($path), true) ?: null;
            } catch (\Throwable $e) {}

            $metadata = is_array($feature) ? $this->extractMetadataFromFeature($feature) : [
                'properties_snapshot' => [],
                'geojson_bbox' => null,
            ];

            $m = new Geojson([
                'geojson' => ['__stored_in_file' => true],
                'id_user' => $userId,
                'properties_snapshot' => $metadata['properties_snapshot'],
                'geojson_bbox' => $metadata['geojson_bbox'],
            ]);
            $m->id_geojson = $id;
            $m->save();
            $m->update([
                'geojson_path' => $path,
                'geojson_size' => $size,
            ]);
            $createdCount++;
        }

        try {
            DB::statement("SELECT setval(pg_get_serial_sequence('geojson','id_geojson'), (SELECT COALESCE(MAX(id_geojson),1) FROM geojson))");
        } catch (\Throwable $e) {}

        return redirect()->route('dashboard.geojson.index')->with('success', "Sinkronisasi selesai: {$createdCount} baris ditambahkan.");
    }
}
