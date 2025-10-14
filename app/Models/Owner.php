<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Owner extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'owner';
    protected $primaryKey = 'id_owner';

    protected $fillable = [
        'name',
        'wali',
        'type',
        'no_hp',
    ];
    protected $dates = ['deleted_at'];

    public function geojsons()
    {
        return $this->hasMany(Geojson::class, 'id_owner');
    }
}
