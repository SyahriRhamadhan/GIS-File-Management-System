<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Insert example categories into the 'kategori' table
        Kategori::create([
            'nama_kategori' => 'Kawasan Sumber Daya Air',
            'kode_warna' => '#f7a1cc',
            'ket_warna' => 'Kawasan yang meliputi sumber daya air',
        ]);

        Kategori::create([
            'nama_kategori' => 'Kawasan Industri',
            'kode_warna' => '#34a853',
            'ket_warna' => 'Kawasan yang digunakan untuk kegiatan industri',
        ]);

        Kategori::create([
            'nama_kategori' => 'Kawasan Perumahan',
            'kode_warna' => '#ff6f61',
            'ket_warna' => 'Kawasan yang digunakan untuk perumahan masyarakat',
        ]);

    }
}
