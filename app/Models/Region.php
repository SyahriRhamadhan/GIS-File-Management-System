<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Region extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'region';
    protected $primaryKey = 'id_region';

    protected $fillable = [
        'name',
        'provinsi',
        'kabupaten',
        'kecamatan',
        'desa',
        'detail',
        'link',
        'deleted_at',
    ];


    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_region');
    }
}
