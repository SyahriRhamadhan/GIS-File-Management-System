<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        // Seed data Provinsi
        $provinsi = Region::create([
            'name' => 'Jawa Barat',
            'type' => 'provinsi',
            'parent_id' => null,
            'link' => 'https://jabar.go.id',
            'alamat' => 'Bandung, Jawa Barat',
        ]);

        // Seed data Kabupaten
        $kabupaten = Region::create([
            'name' => 'Kabupaten Bandung',
            'type' => 'kabupaten',
            'parent_id' => $provinsi->id_region,
            'link' => 'https://kab-bandung.go.id',
            'alamat' => 'Soreang, Kabupaten Bandung',
        ]);

        // Seed data Kecamatan
        $kecamatan = Region::create([
            'name' => 'Kecamatan Baleendah',
            'type' => 'kecamatan',
            'parent_id' => $kabupaten->id_region,
            'link' => 'https://baleendah.bandungkab.go.id',
            'alamat' => 'Baleendah, Kabupaten Bandung',
        ]);

        // Seed data Desa
        Region::create([
            'name' => 'Desa Rancamanyar',
            'type' => 'desa',
            'parent_id' => $kecamatan->id_region,
            'link' => 'https://rancamanyar.desa.id',
            'alamat' => 'Rancamanyar, Baleendah',
        ]);
    }
}
