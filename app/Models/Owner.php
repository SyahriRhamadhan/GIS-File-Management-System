<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Owner extends Model
{
    use HasFactory;

    protected $table = 'owner';
    protected $primaryKey = 'id_owner';

    protected $fillable = [
        'name',
        'wali',
        'type',
    ];

    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_owner');
    }
}
