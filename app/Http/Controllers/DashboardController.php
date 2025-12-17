<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Geojson;
use App\Models\Region;
use App\Models\Kategori;
use App\Models\Owner;
use App\Models\Report;
use App\Models\User;
use App\Models\PewarnaanRdtr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private const FILTER_PER_PAGE_CHOICES = [150, 500, 1000, 1500, 3000, 5000];
    public function index(Request $request)
    {
        // Optional filter berdasarkan query param id atau ids (comma-separated)
        $idsParam = $request->query('ids');
        $idParam = $request->query('id');
        $limitParam = $request->query('limit');
        $loadAll = $request->boolean('load_all', false);

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

        $limitValue = null;
        if (is_numeric($limitParam)) {
            $limitValue = max(0, (int) $limitParam);
        }

        $shouldLoadGeojsons = false;

        if (!$shouldLoadGeojsons) {
            // Skip sending heavy GeoJSON payloads; frontend will fetch via API.
            $geojsons = collect([]);
        } else {
            if ($limitValue && empty($selectedIds)) {
                $geojsonQuery->limit($limitValue);
            }

            $geojsons = $geojsonQuery
                ->select([
                    'geojson.id_geojson',
                    'geojson.source_name',
                    'geojson.main_category',
                    'geojson.id_kategori',
                    'geojson.geojson',
                    'geojson.created_at'
                ])
                ->get()
                ->map(function ($geojson) {
                    if (is_string($geojson->geojson)) {
                        $geojson->geojson = json_decode($geojson->geojson, true);
                    }
                    // Add kode_warna from kategori relation
                    $geojson->kode_warna = $geojson->kategori->kode_warna ?? '#3388ff';
                    return $geojson;
                });

            $rdtr = PewarnaanRdtr::select('kode', 'sub_zona', 'kode_warna', 'rgb')->get();
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
            $geojsons = $geojsons->map(function ($item) use ($bySubZona, $byKode) {
                $color = $item->kode_warna;
                if ((empty($color) || $color === '#3388ff') && is_array($item->geojson)) {
                    $props = $item->geojson['properties'] ?? [];
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
                    if ($color) {
                        $item->kode_warna = $color;
                    }
                }
                return $item;
            });
        }

        $regions = Region::all();
        $user = Auth::user();

        // ====== STATISTICS FOR DASHBOARD ======

        // Total counts
        $stats = [
            'total_geojsons' => Geojson::count(),
            'total_kategoris' => Kategori::count(),
            'total_regions' => Region::count(),
            'total_reports' => Report::count(),
            'total_owners' => Owner::count(),
            'total_users' => User::count(),
        ];

        // Geojsons by category (grouped by orde1, get color from most used kategori per orde1)
        $byCategory = Geojson::select(
            'kategori.orde1',
            'kategori.id_kategori',
            'kategori.kode_warna',
            DB::raw('COUNT(*) as total')
        )
            ->leftJoin('kategori', 'geojson.id_kategori', '=', 'kategori.id_kategori')
            ->groupBy('kategori.orde1', 'kategori.id_kategori', 'kategori.kode_warna')
            ->orderByDesc('total')
            ->get()
            ->groupBy('orde1')
            ->map(function ($group) {
                // Get the most used kategori in this orde1 group
                $mostUsed = $group->first();
                $totalInOrde1 = $group->sum('total');

                return [
                    'orde1' => $mostUsed->orde1 ?? 'Tanpa Kategori',
                    'kode_warna' => $mostUsed->kode_warna ?? '#999999',
                    'total' => $totalInOrde1
                ];
            })
            ->sortByDesc('total')
            ->values();

        // Geojsons by region (using name, kecamatan, or desa - whichever is filled)
        $byRegion = Geojson::select(
            'region.name',
            'region.kecamatan',
            'region.desa',
            DB::raw('COUNT(*) as total')
        )
            ->leftJoin('region', 'geojson.id_region', '=', 'region.id_region')
            ->groupBy('region.name', 'region.kecamatan', 'region.desa')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $regionName = $item->name;
                if (empty($regionName)) {
                    $regionName = $item->kecamatan;
                }
                if (empty($regionName)) {
                    $regionName = $item->desa;
                }
                if (empty($regionName)) {
                    $regionName = 'Tanpa Region';
                }

                return [
                    'region_name' => $regionName,
                    'total' => $item->total
                ];
            });

        // Geojsons by owner type
        $byOwnerType = Geojson::select('owner.type', DB::raw('COUNT(*) as total'))
            ->leftJoin('owner', 'geojson.id_owner', '=', 'owner.id_owner')
            ->whereNotNull('owner.type')
            ->groupBy('owner.type')
            ->orderByDesc('total')
            ->get();

        // Geojson creation timeline (last 30 days)
        $timeline = Geojson::select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as total'))
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top 10 users by geojson count
        $topUsers = User::select('users.name', DB::raw('COUNT(geojson.id_geojson) as total'))
            ->leftJoin('geojson', 'users.id', '=', 'geojson.id_user')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        // Reports by sifat (urgency level)
        $reportBySifat = Report::select('sifat', DB::raw('COUNT(*) as total'))
            ->groupBy('sifat')
            ->get();

        // Recent geojsons (last 10)
        $recentGeojsons = Geojson::with(['kategori', 'region', 'owner', 'user'])
            ->select(['id_geojson', 'source_name', 'id_kategori', 'id_region', 'id_owner', 'id_user', 'created_at', 'properties_snapshot'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($geojson) {
                $properties = $this->normalizeProperties($geojson->properties_snapshot ?? []);
                $kategoriMeta = $this->buildKategoriMeta($geojson->kategori, $properties);
                return [
                    'id_geojson' => $geojson->id_geojson,
                    'source_name' => $geojson->source_name,
                    'category' => $kategoriMeta['display_label'] ?? 'N/A',
                    'region' => $geojson->region->name ?? 'N/A',
                    'owner' => $geojson->owner->name ?? 'N/A',
                    'user' => $geojson->user->name ?? 'N/A',
                    'created_at' => $geojson->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('dashboard', [
            'geojsons' => $geojsons,
            'regions' => $regions,
            'user' => $user,
            'selectedIds' => array_map('strval', $selectedIds),

            // Statistics data
            'stats' => $stats,
            'byCategory' => $byCategory,
            'byRegion' => $byRegion,
            'byOwnerType' => $byOwnerType,
            'timeline' => $timeline,
            'topUsers' => $topUsers,
            'reportBySifat' => $reportBySifat,
            'recentGeojsons' => $recentGeojsons,

            // Performance: Add metadata for lazy loading
            'hasMoreData' => !$shouldLoadGeojsons,
        ]);
    }

    /**
     * API endpoint for lazy loading GeoJSON data
     * GET /api/dashboard/geojsons
     */
    public function getGeojsons(Request $request)
    {
        $mode = $request->query('mode', 'meta');
        $perPage = $this->resolvePerPage((int) $request->query('per_page', self::FILTER_PER_PAGE_CHOICES[0]));
        $categoryFilter = $request->query('category');
        $mainCategoryFilter = $request->query('main_category');
        $idsParam = $request->query('ids');
        $search = trim((string) $request->query('search', ''));

        $query = Geojson::with('kategori');

        if ($this->isPublicGeojsonRequest($request)) {
            $this->applyPublicVisibilityScope($query);
        }

        if ($mainCategoryFilter) {
            $query->where('geojson.main_category', $mainCategoryFilter);
        }

        if ($categoryFilter) {
            $query->whereHas('kategori', function ($q) use ($categoryFilter) {
                $q->where('orde0', $categoryFilter);
            });
        }

        if ($mode !== 'full' && $search !== '') {
            $query->where(function ($q) use ($search) {
                $like = '%' . $search . '%';
                $q->where('geojson.source_name', 'ilike', $like)
                    ->orWhere('geojson.main_category', 'ilike', $like)
                    ->orWhereRaw('CAST(geojson.id_geojson AS TEXT) ilike ?', [$like])
                    ->orWhereRaw('geojson.properties_snapshot::text ilike ?', [$like]);
            });
        }

        if ($mode === 'full') {
            $ids = $this->parseIds($idsParam);
            if (empty($ids)) {
                return response()->json([
                    'data' => [],
                ]);
            }

            $geojsons = $query
                ->whereIn('geojson.id_geojson', $ids)
                ->get()
                ->map(fn($geojson) => $this->formatGeojsonForPayload($geojson, true));

            return response()->json([
                'data' => $geojsons,
            ]);
        }

        $result = $query
            ->select([
                'geojson.id_geojson',
                'geojson.source_name',
                'geojson.main_category',
                'geojson.id_kategori',
                'geojson.geojson_path',
                'geojson.geojson_size',
                'geojson.properties_snapshot',
                'geojson.geojson_bbox',
                'geojson.created_at',
            ])
            ->paginate($perPage);

        $collection = $result->getCollection()->map(fn($geojson) => $this->formatGeojsonForPayload($geojson, false));
        $result->setCollection($collection);

        return response()->json([
            'data' => $result->items(),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    private function resolvePerPage(int $perPage): int
    {
        $min = min(self::FILTER_PER_PAGE_CHOICES);
        $max = max(self::FILTER_PER_PAGE_CHOICES);

        if ($perPage < $min) {
            return $min;
        }
        if ($perPage > $max) {
            return $max;
        }

        if (in_array($perPage, self::FILTER_PER_PAGE_CHOICES, true)) {
            return $perPage;
        }

        return self::FILTER_PER_PAGE_CHOICES[0];
    }

    public function showGeojson(Request $request, Geojson $geojson)
    {
        if ($this->isPublicGeojsonRequest($request) && $this->shouldHideGeojsonFromPublic($geojson->main_category)) {
            abort(404);
        }
        return response()->json($this->formatGeojsonForPayload($geojson, true));
    }

    protected function isPublicGeojsonRequest(Request $request): bool
    {
        return $request->routeIs('api.public.geojsons') || $request->routeIs('api.public.geojson.show');
    }

    protected function applyPublicVisibilityScope($query): void
    {
        $hiddenCategories = $this->getPublicHiddenMainCategories();
        if (empty($hiddenCategories)) {
            return;
        }

        $query->where(function ($q) use ($hiddenCategories) {
            $q->whereNull('geojson.main_category')
                ->orWhereNotIn('geojson.main_category', $hiddenCategories);
        });
    }

    protected function shouldHideGeojsonFromPublic(?string $mainCategory): bool
    {
        if (!is_string($mainCategory)) {
            return false;
        }
        $trimmed = trim($mainCategory);
        if ($trimmed === '') {
            return false;
        }

        foreach ($this->getPublicHiddenMainCategories() as $hidden) {
            if (strcasecmp($trimmed, $hidden) === 0) {
                return true;
            }
        }
        return false;
    }

    protected function getPublicHiddenMainCategories(): array
    {
        $raw = config('map.public_hidden_main_categories', []);
        $list = [];
        foreach ($raw as $value) {
            if (!is_string($value)) {
                continue;
            }
            $trimmed = trim($value);
            if ($trimmed !== '') {
                $list[] = $trimmed;
            }
        }
        return $list;
    }

    private function parseIds($idsParam): array
    {
        if (is_array($idsParam)) {
            return collect($idsParam)
                ->map(fn($v) => (int) $v)
                ->filter(fn($v) => $v > 0)
                ->values()
                ->all();
        }

        if (is_string($idsParam)) {
            return collect(explode(',', $idsParam))
                ->map(fn($v) => (int) trim($v))
                ->filter(fn($v) => $v > 0)
                ->values()
                ->all();
        }

        return [];
    }

    private function normalizeProperties($properties): array
    {
        if (is_array($properties)) {
            return $properties;
        }

        if (is_string($properties)) {
            $decoded = json_decode($properties, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return [];
    }

    private function normalizeKategoriKey(string $value): string
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return '';
        }

        $lower = function_exists('mb_strtolower') ? mb_strtolower($trimmed) : strtolower($trimmed);
        // Remove separators and duplicated whitespace so "Budidaya" == "Budi Daya"
        $normalized = preg_replace('/[^a-z0-9]+/', '', $lower);
        return $normalized ?? '';
    }

    private function resolveKategoriDisplayName($kategori): ?string
    {
        if (!$kategori) {
            return null;
        }

        $orders = ['orde4', 'orde3', 'orde2', 'orde1', 'orde0'];
        foreach ($orders as $field) {
            $value = is_array($kategori) ? ($kategori[$field] ?? null) : $kategori->{$field} ?? null;
            if (is_string($value)) {
                $trimmed = trim($value);
                if ($trimmed !== '') {
                    return $trimmed;
                }
            }
        }

        return null;
    }

    private function indexKategoriLookupValues(array &$lookup, array $data): void
    {
        foreach (['orde4', 'orde3', 'orde2', 'orde1', 'orde0'] as $field) {
            $value = $data[$field] ?? null;
            if (is_string($value)) {
                $normalized = $this->normalizeKategoriKey($value);
                if ($normalized !== '') {
                    $lookup[$normalized] = $data;
                }
            }
        }

        if (!empty($data['kode']) && is_string($data['kode'])) {
            $normalized = $this->normalizeKategoriKey($data['kode']);
            if ($normalized !== '') {
                $lookup[$normalized] = $data;
            }
        }
    }

    private function getKategoriLookup(): array
    {
        static $lookup = null;
        if ($lookup !== null) {
            return $lookup;
        }

        $lookup = [];
        $kategoris = Kategori::select('id_kategori', 'orde0', 'orde1', 'orde2', 'orde3', 'orde4', 'kode', 'kode_warna', 'layer_order')->get();
        foreach ($kategoris as $kategori) {
            $data = [
                'id_kategori' => $kategori->id_kategori,
                'orde0' => $kategori->orde0,
                'orde1' => $kategori->orde1,
                'orde2' => $kategori->orde2,
                'orde3' => $kategori->orde3,
                'orde4' => $kategori->orde4,
                'kode' => $kategori->kode,
                'kode_warna' => $kategori->kode_warna,
                'layer_order' => $kategori->layer_order,
                'display_name' => $this->resolveKategoriDisplayName($kategori),
            ];
            $this->indexKategoriLookupValues($lookup, $data);
        }

        return $lookup;
    }

    private function matchKategoriLookupValue(array $lookup, ?string $value): ?array
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $candidates = [$value];
        if (str_contains($value, '/')) {
            foreach (explode('/', $value) as $fragment) {
                $fragment = trim($fragment);
                if ($fragment !== '') {
                    $candidates[] = $fragment;
                }
            }
        }

        foreach ($candidates as $candidate) {
            $normalized = $this->normalizeKategoriKey($candidate);
            if (isset($lookup[$normalized])) {
                return $lookup[$normalized];
            }
        }

        return null;
    }

    private function inferKategoriFromProperties(array $properties): ?array
    {
        if (empty($properties)) {
            return null;
        }

        $lookup = $this->getKategoriLookup();
        $upperProps = [];
        foreach ($properties as $key => $value) {
            $upperProps[strtoupper((string) $key)] = $value;
        }

        $candidateKeys = [
            'SIMBOLOGI',
            'USULAN',
            'USULAN_1',
            'KETERANGAN',
            'KETERANG_1',
            'KLS_IV',
            'KLS_IV_1',
            'KLS_III',
            'KLS_III_1',
            'KLS_II',
            'KLS_I',
            'KLS_I_1',
        ];

        foreach ($candidateKeys as $key) {
            if (!array_key_exists($key, $upperProps)) {
                continue;
            }
            $rawValue = $upperProps[$key];
            if (is_scalar($rawValue) || (is_object($rawValue) && method_exists($rawValue, '__toString'))) {
                $match = $this->matchKategoriLookupValue($lookup, (string) $rawValue);
                if ($match) {
                    return $match;
                }
            }
        }

        // No direct match in kategori table; build inferred category based on available fields.
        $fallbackKeys = [
            'SIMBOLOGI',
            'USULAN_1',
            'USULAN',
            'KLS_III_1',
            'KLS_III',
            'KLS_II',
            'KLS_I_1',
            'KLS_I',
        ];

        foreach ($fallbackKeys as $key) {
            if (empty($upperProps[$key])) {
                continue;
            }
            $value = trim((string) $upperProps[$key]);
            if ($value === '') {
                continue;
            }

            $color = $this->generateColorFromString($value);

            return [
                'id_kategori' => null,
                'layer_order' => null,
                'orde0' => $upperProps['KLS_I'] ?? ($upperProps['KLS_I_1'] ?? null),
                'orde1' => $upperProps['KLS_I_1'] ?? ($upperProps['KLS_II'] ?? null),
                'orde2' => $upperProps['KLS_II'] ?? ($upperProps['KLS_III'] ?? null),
                'orde3' => $upperProps['KLS_III'] ?? ($upperProps['KLS_III_1'] ?? null),
                'orde4' => $upperProps['KLS_IV'] ?? ($upperProps['KLS_IV_1'] ?? null),
                'kode' => null,
                'kode_warna' => $color,
                'display_name' => $value,
                'inferred' => true,
            ];
        }

        return null;
    }

    private function generateColorFromString(string $value): string
    {
        $normalized = $this->normalizeKategoriKey($value);
        if ($normalized === '') {
            $normalized = md5($value);
        }
        $hash = substr(md5($normalized), 0, 6);
        // Ensure the color is not too dark by bumping channels slightly
        $r = max(64, hexdec(substr($hash, 0, 2)));
        $g = max(64, hexdec(substr($hash, 2, 2)));
        $b = max(64, hexdec(substr($hash, 4, 2)));
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }

    private function buildKategoriMeta(?Kategori $kategori, array $properties): array
    {
        $payload = null;
        $displayLabel = null;
        $inferredColor = null;

        if ($kategori) {
            $payload = [
                'id_kategori' => $kategori->id_kategori,
                'layer_order' => $kategori->layer_order,
                'orde0' => $kategori->orde0,
                'orde1' => $kategori->orde1,
                'orde2' => $kategori->orde2,
                'orde3' => $kategori->orde3,
                'orde4' => $kategori->orde4,
                'kode' => $kategori->kode,
                'kode_warna' => $kategori->kode_warna,
                'display_name' => $this->resolveKategoriDisplayName($kategori),
                'inferred' => false,
            ];
            $displayLabel = $payload['display_name'] ?? $kategori->orde0;
        } else {
            $match = $this->inferKategoriFromProperties($properties);
            if ($match) {
                $payload = [
                    'id_kategori' => $match['id_kategori'] ?? null,
                    'layer_order' => $match['layer_order'] ?? null,
                    'orde0' => $match['orde0'] ?? null,
                    'orde1' => $match['orde1'] ?? null,
                    'orde2' => $match['orde2'] ?? null,
                    'orde3' => $match['orde3'] ?? null,
                    'orde4' => $match['orde4'] ?? null,
                    'kode' => $match['kode'] ?? null,
                    'kode_warna' => $match['kode_warna'] ?? null,
                    'display_name' => $match['display_name'] ?? $this->resolveKategoriDisplayName($match),
                    'inferred' => true,
                ];
                $displayLabel = $payload['display_name'] ?? $match['orde0'] ?? null;
                $inferredColor = $match['kode_warna'] ?? null;
            }
        }

        return [
            'kategori' => $payload,
            'display_label' => $displayLabel,
            'inferred_color' => $inferredColor,
        ];
    }

    private function formatGeojsonForPayload(Geojson $geojson, bool $includeGeometry = false): array
    {
        $properties = $this->normalizeProperties($geojson->properties_snapshot ?? []);

        $feature = [
            'type' => 'Feature',
            'properties' => $properties,
        ];

        if ($includeGeometry) {
            $full = $this->loadGeojsonFeature($geojson);
            if (is_array($full)) {
                $feature = $full;
                if (!isset($feature['properties']) || !is_array($feature['properties'])) {
                    $feature['properties'] = $properties;
                }
            }
        }

        $categoryProps = is_array($feature['properties']) ? $feature['properties'] : $properties;
        $kategoriMeta = $this->buildKategoriMeta($geojson->kategori, $categoryProps);

        $color = $geojson->kategori->kode_warna ?? null;
        if (!$color) {
            [$bySubZona, $byKode] = $this->getRdtrMappings();
            $namobj = $categoryProps['NAMOBJ'] ?? null;
            $kodunk = $categoryProps['KODUNK'] ?? null;
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
        if (!$color && !empty($kategoriMeta['inferred_color'])) {
            $color = $kategoriMeta['inferred_color'];
        }
        if (!$color) {
            $color = '#3388ff';
        }

        return [
            'id_geojson' => $geojson->id_geojson,
            'source_name' => $geojson->source_name,
            'main_category' => $geojson->main_category,
            'id_kategori' => $geojson->id_kategori,
            'kategori' => $kategoriMeta['kategori'],
            'kategori_display_name' => $kategoriMeta['display_label'],
            'geojson' => $feature,
            'geojson_bbox' => $geojson->geojson_bbox,
            'kode_warna' => $color,
            'created_at' => $geojson->created_at,
        ];
    }

    private function loadGeojsonFeature(Geojson $geojson): ?array
    {
        if (!empty($geojson->geojson_path)) {
            try {
                if (Storage::exists($geojson->geojson_path)) {
                    $content = Storage::get($geojson->geojson_path);
                    $decoded = json_decode($content, true);
                    if (is_array($decoded)) {
                        return $decoded;
                    }
                }
            } catch (\Throwable $e) {
            }
        }

        $data = $geojson->getRawOriginal('geojson');
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        } elseif (is_array($data)) {
            return $data;
        }

        return null;
    }

    private function getRdtrMappings(): array
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $bySubZona = [];
        $byKode = [];
        $rdtr = PewarnaanRdtr::select('kode', 'sub_zona', 'kode_warna', 'rgb')->get();

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

        $cached = [$bySubZona, $byKode];
        return $cached;
    }

    /**

     * API endpoint to get minimal category/hierarchy data

     * GET /api/dashboard/categories

     */

    public function getCategories()

    {

        $categories = Geojson::with('kategori')

            ->select([

                'geojson.id_geojson',

                'geojson.source_name',

                'geojson.main_category',

                'geojson.id_kategori',

                'geojson.properties_snapshot',

            ])

            ->get()

            ->map(function ($item) {

                $properties = $this->normalizeProperties($item->properties_snapshot ?? []);

                $meta = $this->buildKategoriMeta($item->kategori, $properties);

                $mainCategory = $item->main_category ?? 'Uncategorized';

                $categoryName = $meta['display_label'] ?? $item->kategori->orde0 ?? 'Tanpa Kategori';

                $color = $item->kategori->kode_warna ?? $meta['inferred_color'] ?? null;



                return [

                    'main_category' => $mainCategory,

                    'category_name' => $categoryName,

                    'color' => $color,

                    'geojson' => $item,

                    'properties' => $properties,

                    'meta' => $meta,

                ];
            })

            ->groupBy(fn($entry) => "{$entry['main_category']} - {$entry['category_name']}")

            ->map(function ($entries, $key) {

                $first = $entries->first();



                return [

                    'key' => $key,

                    'count' => $entries->count(),

                    'color' => $first['color'],

                    'items' => $entries->map(function ($entry) {

                        /** @var \App\Models\Geojson $geojson */

                        $geojson = $entry['geojson'];



                        return [

                            'id' => $geojson->id_geojson,

                            'source_name' => $geojson->source_name,

                            'properties' => $entry['properties'],

                            'kategori' => $entry['meta']['kategori'],

                        ];
                    })->values(),

                ];
            })

            ->values();



        return response()->json(['data' => $categories]);
    }






    /**


     * API endpoint to expose RTRW categories grouped by their deepest orde.

     */

    public function getRtrwCategories()

    {

        $categories = Kategori::select([

            'id_kategori',

            'orde0',

            'orde1',

            'orde2',

            'orde3',

            'orde4',

            'kode',

            'kode_warna',

            'layer_order',

        ])

            ->orderBy('orde0')

            ->orderBy('layer_order')

            ->get()

            ->map(function ($kategori) {

                return [

                    'id_kategori' => $kategori->id_kategori,

                    'orde0' => $kategori->orde0,

                    'orde1' => $kategori->orde1,

                    'orde2' => $kategori->orde2,

                    'orde3' => $kategori->orde3,

                    'orde4' => $kategori->orde4,

                    'kode' => $kategori->kode,

                    'kode_warna' => $kategori->kode_warna,

                    'layer_order' => $kategori->layer_order,

                    'display_name' => $this->resolveKategoriDisplayName($kategori),

                ];
            })

            ->groupBy('orde0')

            ->map(fn($items, $orde0) => [

                'orde0' => $orde0,

                'items' => $items->values(),

            ])

            ->values();



        return response()->json([
            'data' => $categories,
        ]);
    }
}
