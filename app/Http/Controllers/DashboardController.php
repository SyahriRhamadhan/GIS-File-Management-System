<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Geojson;
use App\Models\Region;
use App\Models\Kategori;
use App\Models\Owner;
use App\Models\Report;
use App\Models\User;
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
        ]);
    }
}
