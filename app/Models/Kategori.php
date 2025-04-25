<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'kategori';
    protected $primaryKey = 'id_kategori';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nama_kategori',
        'kode_warna',
        'ket_warna',
    ];

    /**
     * GeoJSON items under this category
     */
    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_kategori', 'id_kategori');
    }
}
