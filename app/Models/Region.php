<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    use HasFactory;

    protected $table = 'region';
    protected $primaryKey = 'id_region';

    protected $fillable = [
        'name',
        'type',
        'parent_id',
    ];

    public function parent()
    {
        return $this->belongsTo(Region::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Region::class, 'parent_id');
    }

    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_region');
    }
}
