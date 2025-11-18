<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
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
    ];

    protected $casts = [
        'geojson' => 'array',
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
        if (is_string($data)) {
            $data = @json_decode($data, true);
        }
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
