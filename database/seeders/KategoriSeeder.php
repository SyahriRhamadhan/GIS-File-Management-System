<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KategoriSeeder extends Seeder
{
    /**
     * Helper function to convert RGB to Hex.
     */
    private function rgbToHex(int $r, int $g, int $b): string
    {
        return sprintf('#%02X%02X%02X', $r, $g, $b);
    }

    /**
     * Dataset for seeding the database.
     */
    private array $rows = [
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Badan Air',
            'orde2' => null,
            'orde3' => null,
            'orde4' => null,
            'kode' => 'BA',
            'rgb' => [151, 219, 242],
            'ket_warna' => 'Biru muda',
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan yang Memberikan Perlindungan terhadap Kawasan Bawahannya **',
            'orde2' => null,
            'orde3' => null,
            'orde4' => null,
            'kode' => 'PTB',
            'rgb' => [25, 65, 40],
            'ket_warna' => null,
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan yang Memberikan Perlindungan terhadap Kawasan Bawahannya **',
            'orde2' => 'Kawasan Hutan Lindung',
            'orde3' => null,
            'orde4' => null,
            'kode' => 'HL',
            'rgb' => [50, 95, 40],
            'ket_warna' => null,
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan yang Memberikan Perlindungan terhadap Kawasan Bawahannya **',
            'orde2' => 'Kawasan Lindung Gambut',
            'orde3' => null,
            'orde4' => null,
            'kode' => 'LG',
            'rgb' => [105, 105, 0],
            'ket_warna' => null,
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Perlindungan Setempat',
            'orde2' => null,
            'orde3' => null,
            'orde4' => null,
            'kode' => 'PS',
            'rgb' => [5, 215, 215],
            'ket_warna' => null,
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'kode' => 'KSA',
            'rgb' => [50, 50, 135],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Suaka Alam',
            'orde3' => 'Cagar Alam',
            'kode' => 'CA',
            'rgb' => [70, 70, 165],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Suaka Alam',
            'orde3' => 'Cagar Alam Laut',
            'kode' => 'CAL',
            'rgb' => [90, 90, 195],
        ],

    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->rows as $i => $r) {
            // $nama = $r['orde3'] ?? $r['orde2'] ?? $r['orde1'];

            Kategori::updateOrCreate(
                ['kode' => $r['kode']],
                [
                    'orde0' => $r['nama'],
                    'orde1'         => $r['orde1']        ?? null,
                    'orde2'         => $r['orde2']        ?? null,
                    'orde3'         => $r['orde3']        ?? null,
                    'orde4'         => $r['orde4']        ?? null,
                    'kode'          => $r['kode'],
                    'kode_warna'    => $this->rgbToHex(...$r['rgb']),
                    'ket_warna'     => $r['ket']          ?? null,
                    'layer_order'   => '2',
                ]
            );
        }
    }
}
