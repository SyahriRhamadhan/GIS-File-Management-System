<?php

namespace Database\Seeders;

use App\Models\PewarnaanRdtr;
use Illuminate\Database\Seeder;

class PewarnaanRdtrSeeder extends Seeder
{
    public function run(): void
    {
        $path = base_path('rdtr_final_full.json');
        if (!file_exists($path)) {
            return;
        }
        $raw = file_get_contents($path);
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return;
        }
        foreach ($data as $row) {
            $kode = isset($row['kode']) ? (string) $row['kode'] : null;
            if (!$kode) {
                continue;
            }
            $rgb = isset($row['rgb']) ? (string) $row['rgb'] : '';
            $hex = null;
            $parts = preg_split('/\s+/', trim($rgb));
            if (count($parts) === 3) {
                $r = max(0, min(255, (int) $parts[0]));
                $g = max(0, min(255, (int) $parts[1]));
                $b = max(0, min(255, (int) $parts[2]));
                $hex = sprintf('#%02x%02x%02x', $r, $g, $b);
            }
            PewarnaanRdtr::updateOrCreate(
                ['kode' => $kode],
                [
                    'sub_zona' => isset($row['sub_zona']) ? (string) $row['sub_zona'] : null,
                    'cmyk' => isset($row['cmyk']) ? (string) $row['cmyk'] : null,
                    'rgb' => $rgb ?: null,
                    'hsv' => isset($row['hsv']) ? (string) $row['hsv'] : null,
                    'kode_warna' => $hex,
                ]
            );
        }
    }
}