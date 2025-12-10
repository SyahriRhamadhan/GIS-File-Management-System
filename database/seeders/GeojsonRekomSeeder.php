<?php

namespace Database\Seeders;

use App\Models\Geojson;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Shapefile\Shapefile;
use Shapefile\ShapefileException;
use Shapefile\ShapefileReader;

class GeojsonRekomSeeder extends Seeder
{
    private const BASE_DIRECTORY = 'database/Rekom';
    private const STORAGE_PREFIX = 'geojson/features/rekom';

    public function run(): void
    {
        $userId = User::where('role', 'superadmin')->value('id') ?? User::query()->value('id');

        if (!$userId) {
            $this->command?->error('GeojsonRekomSeeder dihentikan: tidak ada user untuk kolom id_user.');
            return;
        }

        $files = $this->discoverShapefiles();
        if (empty($files)) {
            $this->command?->warn('Tidak ada file .shp ditemukan di '.self::BASE_DIRECTORY);
            return;
        }

        foreach ($files as $path) {
            try {
                $this->seedFromShapefile($path, $userId);
            } catch (ShapefileException|\Throwable $e) {
                $this->command?->error(sprintf('Gagal memproses %s: %s', $path, $e->getMessage()));
            }
        }
    }

    private function discoverShapefiles(): array
    {
        $base = base_path(self::BASE_DIRECTORY);
        if (!is_dir($base)) {
            return [];
        }

        $result = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isDir()) {
                continue;
            }
            if (strtolower($file->getExtension()) !== 'shp') {
                continue;
            }
            $result[] = $file->getPathname();
        }

        sort($result);
        return $result;
    }

    private function seedFromShapefile(string $absolutePath, int $userId): void
    {
        $relative = Str::of($absolutePath)
            ->after(base_path(self::BASE_DIRECTORY))
            ->trim('\\/');

        $sourceName = (string) Str::of($relative)->replace('\\', '/');
        $slug = Str::of($sourceName)->replace('/', '-')->slug('_');
        $dir = trim(self::STORAGE_PREFIX.'/'.$slug, '/');

        Storage::makeDirectory($dir);

        $options = $this->buildReaderOptions($absolutePath);
        $charset = $this->detectCharset($absolutePath);

        try {
            $reader = new ShapefileReader($absolutePath, $options);
            $reader->setCharset($charset);
        } catch (ShapefileException|\Throwable $exception) {
            $this->command?->error(sprintf('Gagal membuka %s: %s', $absolutePath, $exception->getMessage()));
            return;
        }

        while (true) {
            $recordIndex = $reader->getCurrentRecord();
            $record = $reader->fetchRecord();
            if ($record === false) {
                break;
            }

            if ($record->isDeleted()) {
                continue;
            }

            try {
                $feature = [
                    'type' => 'Feature',
                    'geometry' => json_decode($record->getGeoJSON(), true),
                    'properties' => $this->shouldReadAttributes($options)
                        ? $this->normalizeProperties($record->getDataArray(), $charset)
                        : [],
                ];
            } catch (\Throwable $recordException) {
                $this->command?->warn(sprintf(
                    'Lewati record #%d di %s karena gagal membaca geometri/properti: %s',
                    $recordIndex,
                    $absolutePath,
                    $recordException->getMessage()
                ));
                continue;
            }

            $metadata = $this->extractMetadata($feature);

            try {
                DB::transaction(function () use ($feature, $metadata, $dir, $sourceName, $userId) {
                    $geo = Geojson::create([
                        'geojson' => ['__stored_in_file' => true],
                        'source_name' => $sourceName,
                        'id_user' => $userId ?: null,
                        'id_region' => null,
                        'id_owner' => null,
                        'id_kategori' => null,
                        'main_category' => 'KKPR',
                        'properties_snapshot' => $metadata['properties_snapshot'],
                        'geojson_bbox' => $metadata['geojson_bbox'],
                    ]);

                    $path = sprintf('%s/%s.json', $dir, $geo->id_geojson);
                    Storage::put($path, json_encode($feature));
                    $geo->update([
                        'geojson_path' => $path,
                        'geojson_size' => Storage::size($path) ?: null,
                    ]);
                });
            } catch (QueryException|\Throwable $dbException) {
                $this->command?->error(sprintf(
                    'Gagal menyimpan fitur dari %s (record #%d): %s',
                    $absolutePath,
                    $recordIndex,
                    $dbException->getMessage()
                ));
            }
        }
    }

    private function extractMetadata(array $feature): array
    {
        $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
        $bbox = null;
        $geometry = $feature['geometry'] ?? null;

        if (is_array($geometry) && isset($geometry['coordinates'])) {
            $coords = $geometry['coordinates'];
            $minLng = $minLat = $maxLng = $maxLat = null;

            $walk = function ($node) use (&$walk, &$minLng, &$minLat, &$maxLng, &$maxLat) {
                if (!is_array($node)) {
                    return;
                }
                if (
                    isset($node[0], $node[1]) &&
                    is_numeric($node[0]) &&
                    is_numeric($node[1])
                ) {
                    $lng = (float) $node[0];
                    $lat = (float) $node[1];
                    $minLng = $minLng === null ? $lng : min($minLng, $lng);
                    $maxLng = $maxLng === null ? $lng : max($maxLng, $lng);
                    $minLat = $minLat === null ? $lat : min($minLat, $lat);
                    $maxLat = $maxLat === null ? $lat : max($maxLat, $lat);
                    return;
                }
                foreach ($node as $child) {
                    $walk($child);
                }
            };

            $walk($coords);
            if ($minLng !== null) {
                $bbox = [
                    'min_lng' => $minLng,
                    'min_lat' => $minLat,
                    'max_lng' => $maxLng,
                    'max_lat' => $maxLat,
                ];
            }
        }

        return [
            'properties_snapshot' => $properties,
            'geojson_bbox' => $bbox,
        ];
    }

    private function buildReaderOptions(string $absolutePath): array
    {
        $options = [
            Shapefile::OPTION_DBF_CONVERT_TO_UTF8 => false,
            Shapefile::OPTION_DBF_FORCE_ALL_CAPS => false,
            Shapefile::OPTION_IGNORE_GEOMETRIES_BBOXES => true,
            Shapefile::OPTION_SUPPRESS_Z => true,
            Shapefile::OPTION_SUPPRESS_M => true,
        ];

        if (!file_exists($this->switchExtension($absolutePath, 'dbf'))) {
            $options[Shapefile::OPTION_IGNORE_FILE_DBF] = true;
        }

        if (!file_exists($this->switchExtension($absolutePath, 'shx'))) {
            $options[Shapefile::OPTION_IGNORE_FILE_SHX] = true;
        }

        return $options;
    }

    private function shouldReadAttributes(array $options): bool
    {
        return empty($options[Shapefile::OPTION_IGNORE_FILE_DBF]);
    }

    private function detectCharset(string $absolutePath): string
    {
        $cpgPath = $this->switchExtension($absolutePath, 'cpg');
        if (!is_file($cpgPath)) {
            return 'UTF-8';
        }

        $content = strtoupper(trim((string) @file_get_contents($cpgPath)));
        if ($content === '') {
            return 'UTF-8';
        }

        $map = [
            'ANSI 1252' => 'CP1252',
            'ANSI1252' => 'CP1252',
            'UTF8' => 'UTF-8',
            'UTF-8' => 'UTF-8',
            'ISO8859-1' => 'ISO-8859-1',
            'ISO-8859-1' => 'ISO-8859-1',
            'WINDOWS-1252' => 'CP1252',
        ];

        if (is_numeric($content)) {
            return 'CP' . $content;
        }

        return $map[$content] ?? $content;
    }

    private function normalizeProperties(array $properties, string $charset): array
    {
        $normalized = [];
        foreach ($properties as $key => $value) {
            $normalized[$key] = $this->castPropertyValue($value, $charset);
        }

        return $normalized;
    }

    private function castPropertyValue($value, string $charset)
    {
        if (is_string($value)) {
            return $this->convertToUtf8($value, $charset);
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_array($value)) {
            foreach ($value as $childKey => $childValue) {
                $value[$childKey] = $this->castPropertyValue($childValue, $charset);
            }
            return $value;
        }

        return $value;
    }

    private function convertToUtf8(string $value, string $charset): string
    {
        $charset = $charset ?: 'UTF-8';
        $upper = strtoupper($charset);

        if ($upper === 'UTF-8') {
            return $this->stripInvalidUtf8($value);
        }

        $converted = @mb_convert_encoding($value, 'UTF-8', $charset);
        if ($converted === false) {
            $converted = @iconv($charset, 'UTF-8//IGNORE', $value);
        }

        if ($converted === false) {
            return $this->stripInvalidUtf8($value);
        }

        return $converted;
    }

    private function stripInvalidUtf8(string $value): string
    {
        $clean = @mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        if ($clean !== false) {
            return $clean;
        }

        $fallback = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
        return $fallback === false ? '' : $fallback;
    }

    private function switchExtension(string $absolutePath, string $extension): string
    {
        return preg_replace('/\\.[^.]+$/i', '.' . $extension, $absolutePath);
    }
}
