<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'id_kategori',
    ];

    protected $casts = [
        'geojson' => 'array',
    ];
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
}
