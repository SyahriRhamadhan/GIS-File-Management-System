<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Geojson extends Model
{
    use HasFactory;

    protected $table = 'geojson';
    protected $primaryKey = 'id_geojson';

    protected $fillable = [
        'geojson',
        'id_user',
        'id_region',
        'id_owner',
    ];

    protected $casts = [
        'geojson' => 'array',
    ];

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
}
