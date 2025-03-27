<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OwnerSeeder extends Seeder
{
    public function run()
    {
        // Menambahkan data dummy ke tabel owner
        DB::table('owner')->insert([
            [
                'name' => 'PT. ABC',
                'wali' => 'indah',
                'type' => 'PT',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'CV. XYZ',
                'wali' => 'budi',
                'type' => 'CV',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Yayasan Pendidikan',
                'wali' => 'sari',
                'type' => 'Yayasan/Lembaga',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Perorangan Joko',
                'wali' => null,
                'type' => 'Perorangan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
