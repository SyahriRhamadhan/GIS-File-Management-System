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
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Suaka Alam',
            'orde3' => 'Suaka Margasatwa',
            'kode' => 'SM',
            'rgb' => [110, 110, 225],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Suaka Alam',
            'orde3' => 'Suaka Margasatwa Laut',
            'kode' => 'SML',
            'rgb' => [130, 130, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Pelestarian Alam',
            'orde3' => NULL,
            'kode' => 'KPA',
            'rgb' => [120, 90, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Pelestarian Alam',
            'orde3' => 'Taman Nasional',
            'kode' => 'TN',
            'rgb' => [155, 135, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Pelestarian Alam',
            'orde3' => 'Taman Hutan Raya',
            'kode' => 'THR',
            'rgb' => [185, 165, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Pelestarian Alam',
            'orde3' => 'Taman Wisata Alam',
            'kode' => 'TWA',
            'rgb' => [210, 190, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Pelestarian Alam',
            'orde3' => 'Taman Wisata Alam Laut',
            'kode' => 'TWL',
            'rgb' => [230, 210, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Taman Buru',
            'kode' => 'TB',
            'rgb' => [70, 150, 255],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi di Wilayah Pesisir dan Pulau-Pulau Kecil',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'KWP',
            'rgb'   => [0, 130, 125],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi di Wilayah Pesisir dan Pulau-Pulau Kecil',
            'orde3' => 'Kawasan Konservasi Pesisir dan PulauPulau Kecil',
            'orde4' => '',
            'kode'  => 'KP3K',
            'rgb'   => [20, 150, 170],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi Pesisir dan PulauPulau Kecil',
            'orde4' => 'Suaka Pesisir',
            'kode'  => 'SPS',
            'rgb'   => [70, 180, 190],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi
Pesisir dan PulauPulau Kecil',
            'orde4' => 'Suaka Pulau Kecil',
            'kode'  => 'SPK',
            'rgb'   => [120, 205, 210],
        ],
        [
            'nama' => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi
Pesisir dan PulauPulau Kecil',
            'orde4' => 'Taman Pesisir',
            'kode'  => 'TP',
            'rgb'   => [160, 230, 220],
        ],
        //
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi
Pesisir dan PulauPulau Kecil',
            'orde4' => 'Taman Pulau Kecil',
            'kode'  => 'TPK',
            'rgb'   => [200, 240, 230],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi
Maritim',
            'orde4' => '',
            'kode'  => 'KMR',
            'rgb'   => [5, 160, 125],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi Maritim',
            'orde4' => 'Daerah Perlindungan Adat Maritim',
            'kode'  => 'PAM',
            'rgb'   => [30, 180, 125],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi Maritim',
            'orde4' => 'Daerah Perlindungan Budaya Maritim',
            'kode'  => 'PBM',
            'rgb'   => [50, 210, 155],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Konservasi',
            'orde2' => 'Kawasan Konservasi
di Wilayah Pesisir
dan Pulau-Pulau
Kecil',
            'orde3' => 'Kawasan Konservasi Perairan',
            'orde4' => '',
            'kode'  => 'KPR',
            'rgb'   => [80, 245, 125],
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
            'orde2' => 'Kawasan Cagar Alam Geologi',
            'orde3' => 'Kawasan Keunikan Proses Geologi',
            'orde4' => '',
            'kode'  => 'LGE-3',
            'rgb'   => [210, 135, 180],
        ],
        //
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Lindung Geologi',
            'orde2' => 'Kawasan yang Memberikan Perlindungan terhadap Air Tanah',
            'orde3' => 'Kawasan Imbuhan Air Tanah',
            'orde4' => '',
            'kode'  => 'LGE-4',
            'rgb'   => [205, 135, 100],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Cagar Budaya',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'CB',
            'rgb'   => [255, 55, 205],
        ],
        [
            'nama'  => 'Kawasan Lindung',
            'orde1' => 'Kawasan Ekosistem Mangrove',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'EM',
            'rgb'   => [45, 150, 110],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Hutan Produksi',
            'orde2' => 'Kawasan Hutan Produksi Terbatas',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'HPT',
            'rgb'   => [75, 155, 55],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Hutan Produksi',
            'orde2' => 'Kawasan Hutan Produksi Tetap',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'HP',
            'rgb'   => [125, 180, 55],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Hutan Produksi',
            'orde2' => 'Kawasan Hutan Produksi yang dapat Dikonversi',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'HPK',
            'rgb'   => [155, 225, 55],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Perkebunan Rakyat',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'KR',
            'rgb'   => [155, 200, 155],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertanian',
            'orde2' => 'Kawasan Tanaman Pangan',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'P-1',
            'rgb'   => [200, 245, 70],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertanian',
            'orde2' => 'Kawasan Hortikultura',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'P-2',
            'rgb'   => [230, 255, 75],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertanian',
            'orde2' => 'Kawasan Perkebunan',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'P-3',
            'rgb'   => [175, 175, 55],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertanian',
            'orde2' => 'Kawasan Peternakan',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'P-4',
            'rgb'   => [185, 235, 185],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Perikanan',
            'orde2' => 'Kawasan Perikanan Tangkap',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'IK-1',
            'rgb'   => [100, 155, 210],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Perikanan',
            'orde2' => 'Kawasan Perikanan Budidaya',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'IK-2',
            'rgb'   => [130, 185, 210],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pergaraman',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'KEG',
            'rgb'   => [180, 150, 120],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Mineral',
            'orde3' => 'Kawasan Pertambangan Mineral Radioaktif',
            'orde4' => '',
            'kode'  => 'MRA',
            'rgb'   => [25, 45, 75],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Mineral',
            'orde3' => 'Kawasan Pertambangan Mineral Logam',
            'orde4' => '',
            'kode'  => 'MLG',
            'rgb'   => [45, 65, 95],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Mineral',
            'orde3' => 'Kawasan Pertambangan Mineral Bukan Logam',
            'orde4' => '',
            'kode'  => 'MNL',
            'rgb'   => [65, 85, 115],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Mineral',
            'orde3' => 'Kawasan Pertambangan Batuan',
            'orde4' => '',
            'kode'  => 'MBT',
            'rgb'   => [95, 115, 145],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Batubara',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'BR',
            'rgb'   => [125, 145, 175],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pertambangan Minyak dan Gas Bumi',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'MG',
            'rgb'   => [155, 175, 205],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Panas Bumi',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'PB',
            'rgb'   => [205, 0, 0],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertambangan dan Energi',
            'orde2' => 'Kawasan Pembangkit Tenaga Listrik',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'PTL',
            'rgb'   => [0, 255, 205],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Permukiman',
            'orde2' => 'Kawasan Permukiman Perkotaan',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'PK',
            'rgb'   => [245, 155, 30],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Permukiman',
            'orde2' => 'Kawasan Permukiman Perdesaan',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'PD',
            'rgb'   => [235, 155, 60],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Transportasi',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'TR',
            'rgb'   => [215, 55, 0],
        ],
        [
            'nama'  => 'Kawasan Budi Daya',
            'orde1' => 'Kawasan Pertahanan dan Keamanan',
            'orde2' => '',
            'orde3' => '',
            'orde4' => '',
            'kode'  => 'HK',
            'rgb'   => [155, 0, 255],
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
