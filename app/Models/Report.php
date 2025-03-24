<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'report';
    protected $primaryKey = 'id_report';

    protected $fillable = [
        'id_geojson',
        'file_path',
        'description',
        'nomor',
        'sifat',
        'hal',
        'deleted_at',
        'kepada',
    ];

    public function geojson()
    {
        return $this->belongsTo(Geojson::class, 'id_geojson');
    }
}
