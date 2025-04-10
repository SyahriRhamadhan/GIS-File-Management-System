<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['Air Gelubi', 'Bintan Pesisir'],
            ['Batu Lepuk', 'Tambelan'],
            ['Berakit', 'Teluk Sebong'],
            ['Bintan Buyu', 'Teluk Bintan'],
            ['Busung', 'Seri Kuala Lobam'],
            ['Dendun', 'Mantang'],
            ['Ekang Anculai', 'Teluk Sebong'],
            ['Gunung Kijang', 'Gunung Kijang'],
            ['Kampung Hilir', 'Tambelan'],
            ['Kampung Melayu', 'Tambelan'],
            ['Kawal', 'Gunung Kijang'],
            ['Kelong', 'Bintan Pesisir'],
            ['Kuala Sempang', 'Seri Kuala Lobam'],
            ['Kukup', 'Tambelan'],
            ['Lancang Kuning', 'Bintan Utara'],
            ['Malang Rapat', 'Gunung Kijang'],
            ['Mantang Baru', 'Mantang'],
            ['Mantang Besar', 'Mantang'],
            ['Mantang Lama', 'Mantang'],
            ['Mapur', 'Bintan Pesisir'],
            ['Numbing', 'Bintan Pesisir'],
            ['Pangkil', 'Teluk Bintan'],
            ['Penaga', 'Teluk Bintan'],
            ['Pengikik', 'Tambelan'],
            ['Pengudang', 'Teluk Sebong'],
            ['Pengujan', 'Teluk Bintan'],
            ['Pulau Mentebung', 'Tambelan'],
            ['Pulau Pinang', 'Tambelan'],
            ['Sebong Lagoi', 'Teluk Sebong'],
            ['Sebong Pereh', 'Teluk Sebong'],
            ['Tanjung Uban Timur', 'Bintan Utara'],
            ['Tanjung Uban Utara', 'Bintan Utara'],
            ['Teluk Bakau', 'Gunung Kijang'],
            ['Teluk Sekuni', 'Tambelan'],
            ['Tembeling Tanjung', 'Teluk Bintan'],
            ['Tembeling', 'Teluk Bintan'],
            ['Toapaya', 'Toapaya'],
        ];

        foreach ($regions as [$desa, $kecamatan]) {
            $kabupaten = 'Bintan';
            $provinsi = 'Kepulauan Riau';
            $detail = "$desa, $kecamatan, $kabupaten, $provinsi";
            $query = urlencode($detail);
            $link = "https://www.google.com/maps/search/?api=1&query=$query";

            Region::create([
                'name'      => $desa,
                'provinsi'  => $provinsi,
                'kabupaten' => $kabupaten,
                'kecamatan' => $kecamatan,
                'desa'      => $desa,
                'detail'    => $detail,
                'link'      => $link,
            ]);
        }
    }
}
