<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use App\Models\PewarnaanRdtr;

class Geojson extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'geojson';
    protected $primaryKey = 'id_geojson';

    protected $fillable = [
        'geojson',
        'id_user',
        'id_region',
        'id_owner',
        'source_name',
        'main_category',
        'id_kategori',
        'geojson_path',
        'geojson_size',
        'properties_snapshot',
        'geojson_bbox',
    ];

    protected $casts = [
        'geojson' => 'array',
        'geojson_size' => 'integer',
        'properties_snapshot' => 'array',
        'geojson_bbox' => 'array',
    ];
    protected $appends = ['kode_warna', 'orde0', 'ket_warna'];
    protected $dates = ['deleted_at'];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function region()
    {
        return $this->belongsTo(Region::class, 'id_region');
    }

    public function owner()
    {
        return $this->belongsTo(Owner::class, 'id_owner');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'id_geojson');
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'id_kategori', 'id_kategori');
    }

    /**
     * Automatically fetch the actual GeoJSON payload when it is stored on disk.
     */
    public function getGeojsonAttribute($value)
    {
        if (is_array($value) && isset($value['__stored_in_file'])) {
            return $this->loadGeojsonFromStorage() ?: $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
        }

        return $value;
    }

    protected function loadGeojsonFromStorage(): ?array
    {
        if (empty($this->geojson_path)) {
            return null;
        }

        try {
            if (!Storage::exists($this->geojson_path)) {
                return null;
            }
            $content = Storage::get($this->geojson_path);
            if (!$content) {
                return null;
            }
            $decoded = json_decode($content, true);
            return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getKodeWarnaAttribute(): ?string
    {
        if (!empty($this->kategori?->kode_warna)) {
            return $this->kategori->kode_warna;
        }

        static $rdtrBySubZona = null;
        static $rdtrByKode = null;

        if ($rdtrBySubZona === null || $rdtrByKode === null) {
            $rdtrBySubZona = [];
            $rdtrByKode = [];
            $all = PewarnaanRdtr::select('kode', 'sub_zona', 'kode_warna', 'rgb')->get();
            foreach ($all as $r) {
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
                        $rdtrBySubZona[trim((string) $r->sub_zona)] = $hex;
                    }
                    if (!empty($r->kode)) {
                        $rdtrByKode[trim((string) $r->kode)] = $hex;
                    }
                }
            }
        }

        $data = $this->geojson;
        if (is_array($data)) {
            $props = $data['properties'] ?? [];
            $namobj = is_array($props) ? (isset($props['NAMOBJ']) ? trim((string) $props['NAMOBJ']) : null) : null;
            $kodunk = is_array($props) ? ($props['KODUNK'] ?? null) : null;
            if ($namobj && isset($rdtrBySubZona[$namobj])) {
                return $rdtrBySubZona[$namobj];
            }
            if ($kodunk && is_string($kodunk)) {
                $m = [];
                if (preg_match('/^([A-Z0-9\-]+)/', $kodunk, $m)) {
                    $prefix = $m[1];
                    if (isset($rdtrByKode[$prefix])) {
                        return $rdtrByKode[$prefix];
                    }
                }
            }
        }

        return null;
    }

    public function getOrde0Attribute(): ?string
    {
        return $this->kategori?->orde0;
    }

    public function getKetWarnaAttribute(): ?string
    {
        return $this->kategori?->ket_warna;
    }
}
