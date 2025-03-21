<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $table = 'report';
    protected $primaryKey = 'id_report';

    protected $fillable = [
        'id_geojson',
        'file_path',
        'description',
        'nomor',
        'sifat',
        'hal',
        'kepada',
    ];

    public function geojson()
    {
        return $this->belongsTo(Geojson::class, 'id_geojson');
    }
}
