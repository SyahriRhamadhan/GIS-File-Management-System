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
use Inertia\Inertia;

class DashboardController extends Controller
{
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

        $shouldLoadGeojsons = $loadAll || !empty($selectedIds) || ($limitValue !== null && $limitValue > 0);

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
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($geojson) {
                return [
                    'id_geojson' => $geojson->id_geojson,
                    'source_name' => $geojson->source_name,
                    'category' => $geojson->kategori->orde1 ?? 'N/A',
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
        $perPage = $request->query('per_page', 50); // Load 50 at a time
        $categoryFilter = $request->query('category');
        $mainCategoryFilter = $request->query('main_category');

        $query = Geojson::with('kategori')
            ->select([
                'geojson.id_geojson',
                'geojson.source_name',
                'geojson.main_category',
                'geojson.id_kategori',
                'geojson.geojson',
                'geojson.created_at'
            ]);

        // Apply filters if provided
        if ($mainCategoryFilter) {
            $query->where('geojson.main_category', $mainCategoryFilter);
        }

        if ($categoryFilter) {
            $query->whereHas('kategori', function ($q) use ($categoryFilter) {
                $q->where('orde0', $categoryFilter);
            });
        }

        $result = $query->paginate($perPage);

        $geojsons = $result->map(function ($geojson) {
            if (is_string($geojson->geojson)) {
                $geojson->geojson = json_decode($geojson->geojson, true);
            }
            $geojson->kode_warna = $geojson->kategori->kode_warna ?? null;
            return $geojson;
        });

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
        $geojsons = $geojsons->map(function ($item) use ($bySubZona, $byKode) {
            $color = $item->kode_warna;
            if (empty($color) && is_array($item->geojson)) {
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
                } else {
                    $item->kode_warna = '#3388ff';
                }
            } elseif (empty($color)) {
                $item->kode_warna = '#3388ff';
            }
            return $item;
        });

        return response()->json([
            'data' => $geojsons,
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    /**
     * API endpoint to get minimal category/hierarchy data
     * GET /api/dashboard/categories
     */
    public function getCategories()
    {
        // Return only category structure without full GeoJSON
        $categories = Geojson::with('kategori')
            ->select([
                'geojson.id_geojson',
                'geojson.source_name',
                'geojson.main_category',
                'geojson.id_kategori',
                DB::raw('geojson.geojson->\'$.properties\' as properties') // Only properties, not geometry
            ])
            ->get()
            ->groupBy(function ($item) {
                $mainCategory = $item->main_category ?? 'Uncategorized';
                $categoryName = $item->kategori->orde0 ?? 'Tanpa Kategori';
                return "{$mainCategory} › {$categoryName}";
            })
            ->map(function ($items, $key) {
                return [
                    'key' => $key,
                    'count' => $items->count(),
                    'items' => $items->map(function ($item) {
                        $properties = $item->properties;
                        if (is_string($properties)) {
                            $properties = json_decode($properties, true);
                        }
                        return [
                            'id' => $item->id_geojson,
                            'source_name' => $item->source_name,
                            'properties' => $properties,
                        ];
                    }),
                ];
            });

        return response()->json($categories);
    }
}
