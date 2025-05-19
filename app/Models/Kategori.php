<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kategori extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'kategori';
    protected $primaryKey = 'id_kategori';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'orde0',
        'kode_warna',
        'ket_warna',
        'layer_order',
        'orde1',
        'orde2',
        'orde3',
        'orde4',
        'kode',
    ];

    protected $dates = ['deleted_at'];

    /**
     * GeoJSON items under this category
     */
    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_kategori', 'id_kategori');
    }
}
