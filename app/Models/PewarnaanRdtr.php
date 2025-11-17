<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PewarnaanRdtr extends Model
{
    use HasFactory;

    protected $table = 'pewarnaan_rdtr';
    protected $primaryKey = 'id_pewarnaan_rdtr';

    protected $fillable = [
        'kode',
        'sub_zona',
        'cmyk',
        'rgb',
        'hsv',
        'kode_warna',
    ];
}