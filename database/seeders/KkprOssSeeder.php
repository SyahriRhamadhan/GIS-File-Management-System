<?php

namespace Database\Seeders;

use App\Models\Geojson;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Http\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Shapefile\Shapefile;
use Shapefile\ShapefileException;
use Shapefile\ShapefileReader;

class KkprOssSeeder extends Seeder
{
    private const BASE_DIRECTORY = 'C:\\Users\\le\\Documents\\PUPRP\\KKPR\\KKPR OSS';
    private const STORAGE_PREFIX = 'geojson/features/kkpr_oss';

    public function run(): void
    {
        $base = env('KKPR_OSS_PATH', self::BASE_DIRECTORY);
        if (!is_dir($base)) {
            $this->command?->warn("Folder KKPR OSS tidak ditemukan: {$base}");
            return;
        }

        $userId = User::where('role', 'superadmin')->value('id') ?? User::query()->value('id');
        if (!$userId) {
            $this->command?->error('KkprOssSeeder dihentikan: tidak ada user untuk id_user.');
            return;
        }

        $folders = $this->discoverFolders($base);
        if (empty($folders)) {
            $this->command?->warn("Tidak ada folder pemohon di {$base}");
            return;
        }

        $publicDisk = Storage::disk('public');
        $publicDisk->makeDirectory('reports');

        foreach ($folders as $folder) {
            $folderName = basename($folder);
            $pdfFiles = $this->discoverPdfFiles($folder);
            if (empty($pdfFiles)) {
                $this->command?->warn("Lewati {$folderName}: PDF tidak ditemukan.");
                continue;
            }

            $slug = Str::slug($folderName, '_');
            if ($slug === '') {
                $slug = 'pemohon';
            }
            $targetDir = trim(self::STORAGE_PREFIX . '/' . $slug, '/');
            Storage::makeDirectory($targetDir);

            $primaryGeojsonId = Geojson::where('geojson_path', 'like', $targetDir . '/%')
                ->orderBy('id_geojson')
                ->value('id_geojson');

            if (!$primaryGeojsonId) {
                $geojsonIds = $this->seedGeojsonForFolder($folder, $folderName, $userId, $targetDir);
                $primaryGeojsonId = $geojsonIds[0] ?? null;
            }

            if (!$primaryGeojsonId) {
                $this->command?->warn("Lewati {$folderName}: data SHP tidak berhasil dibuat.");
                continue;
            }

            foreach ($pdfFiles as $pdfPath) {
                $this->seedReport($pdfPath, $folderName, $primaryGeojsonId, $publicDisk);
            }
        }
    }

    private function discoverFolders(string $base): array
    {
        $folders = [];
        $iterator = new \DirectoryIterator($base);
        foreach ($iterator as $entry) {
            if ($entry->isDot() || !$entry->isDir()) {
                continue;
            }
            $folders[] = $entry->getPathname();
        }
        sort($folders, SORT_NATURAL | SORT_FLAG_CASE);
        return $folders;
    }

    private function discoverPdfFiles(string $folder): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($folder, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            if (strtolower($file->getExtension()) !== 'pdf') {
                continue;
            }
            $files[] = $file->getPathname();
        }
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);
        return $files;
    }

    private function seedGeojsonForFolder(string $folder, string $folderName, int $userId, string $targetDir): array
    {
        $createdIds = [];
        $zipNames = [];
        $shpNames = [];

        $shpFiles = $this->discoverShapefiles($folder);
        foreach ($shpFiles as $shpPath) {
            $shpNames[] = basename($shpPath);
            $createdIds = array_merge(
                $createdIds,
                $this->seedFromShapefile($shpPath, $folderName, $userId, $targetDir, $shpPath)
            );
        }

        $zipFiles = $this->discoverZipFiles($folder);
        foreach ($zipFiles as $zipPath) {
            $zipNames[] = basename($zipPath);
            $tempDir = $this->extractZip($zipPath);
            if (!$tempDir) {
                continue;
            }
            $zipShps = $this->discoverShapefiles($tempDir);
            foreach ($zipShps as $shpPath) {
                $shpNames[] = basename($shpPath);
                $origin = $zipPath . ' :: ' . basename($shpPath);
                $createdIds = array_merge(
                    $createdIds,
                    $this->seedFromShapefile($shpPath, $folderName, $userId, $targetDir, $origin)
                );
            }
            $this->cleanupDirectory($tempDir);
        }

        if (empty($createdIds)) {
            $placeholderId = $this->createPlaceholderGeojson($folderName, $userId, $zipNames, $shpNames);
            return $placeholderId ? [$placeholderId] : [];
        }

        return $createdIds;
    }

    private function discoverShapefiles(string $folder): array
    {
        if (!is_dir($folder)) {
            return [];
        }
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($folder, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            if (strtolower($file->getExtension()) !== 'shp') {
                continue;
            }
            $files[] = $file->getPathname();
        }
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);
        return $files;
    }

    private function discoverZipFiles(string $folder): array
    {
        if (!is_dir($folder)) {
            return [];
        }
        $files = glob($folder . DIRECTORY_SEPARATOR . '*.zip');
        $files = $files ?: [];
        sort($files, SORT_NATURAL | SORT_FLAG_CASE);
        return $files;
    }

    private function extractZip(string $zipPath): ?string
    {
        if (!class_exists(\ZipArchive::class)) {
            $this->command?->warn('ZipArchive tidak tersedia untuk ekstrak SHP.');
            return null;
        }

        $tmpBase = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR);
        $tempDir = $tmpBase . DIRECTORY_SEPARATOR . 'kkpr_oss_' . Str::uuid();
        if (!mkdir($tempDir, 0775, true) && !is_dir($tempDir)) {
            $this->command?->warn("Gagal membuat folder sementara: {$tempDir}");
            return null;
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            $this->command?->warn("Gagal membuka zip: {$zipPath}");
            $this->cleanupDirectory($tempDir);
            return null;
        }
        try {
            $count = $zip->numFiles;
            for ($i = 0; $i < $count; $i++) {
                $entryName = $zip->getNameIndex($i);
                if (!$entryName || str_starts_with($entryName, '__MACOSX/')) {
                    continue;
                }
                if (str_contains($entryName, '../') || str_contains($entryName, '..\\')) {
                    continue;
                }

                $sanitized = $this->sanitizeZipPath($entryName);
                if ($sanitized === '') {
                    continue;
                }

                $isDir = str_ends_with($entryName, '/');
                $targetPath = $tempDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $sanitized);

                if ($isDir) {
                    if (!is_dir($targetPath)) {
                        @mkdir($targetPath, 0775, true);
                    }
                    continue;
                }

                $ext = strtolower(pathinfo($sanitized, PATHINFO_EXTENSION));
                if (!in_array($ext, ['shp', 'dbf', 'shx', 'prj', 'cpg', 'sbn', 'sbx'], true)) {
                    continue;
                }

                $parent = dirname($targetPath);
                if (!is_dir($parent)) {
                    @mkdir($parent, 0775, true);
                }

                $stream = $zip->getStream($entryName);
                if ($stream === false) {
                    continue;
                }

                $out = fopen($targetPath, 'wb');
                if ($out === false) {
                    fclose($stream);
                    continue;
                }

                stream_copy_to_stream($stream, $out);
                fclose($out);
                fclose($stream);
            }
        } finally {
            $zip->close();
        }

        return $tempDir;
    }

    private function cleanupDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $file) {
            if ($file->isDir()) {
                @rmdir($file->getPathname());
            } else {
                @unlink($file->getPathname());
            }
        }
        @rmdir($dir);
    }

    private function seedFromShapefile(string $absolutePath, string $sourceName, int $userId, string $dir, string $origin): array
    {
        $size = @filesize($absolutePath);
        if ($size !== false && $size < 100) {
            $this->logIssue("Lewati SHP kecil/tidak valid: {$origin}");
            return [];
        }

        $options = $this->buildReaderOptions($absolutePath);
        $charset = $this->detectCharset($absolutePath);

        try {
            $reader = new ShapefileReader($absolutePath, $options);
            $reader->setCharset($charset);
        } catch (ShapefileException|\Throwable $exception) {
            $this->logIssue(sprintf('Gagal membuka %s: %s', $origin, $exception->getMessage()));
            return $this->seedFromShapefileWithOgr($absolutePath, $sourceName, $userId, $dir, $origin);
        }

        $createdIds = [];
        $hadReadError = false;
        $reprojectResolved = false;
        $reprojectConfig = null;
        while (true) {
            try {
                $recordIndex = $reader->getCurrentRecord();
                $record = $reader->fetchRecord();
                if ($record === false) {
                    break;
                }
            } catch (\Throwable $fetchException) {
                $this->logIssue(sprintf('Gagal membaca record dari %s: %s', $origin, $fetchException->getMessage()));
                $hadReadError = true;
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
                $this->logIssue(sprintf(
                    'Lewati record #%d di %s karena gagal membaca geometri/properti: %s',
                    $recordIndex,
                    $origin,
                    $recordException->getMessage()
                ));
                continue;
            }

            if (!is_array($feature['geometry'] ?? null)) {
                $this->logIssue(sprintf(
                    'Lewati record #%d di %s karena geometri tidak valid.',
                    $recordIndex,
                    $origin
                ));
                continue;
            }

            if (!$reprojectResolved) {
                $reprojectConfig = $this->resolveReprojectionConfig($feature['geometry'], $absolutePath, $origin);
                $reprojectResolved = true;
            }

            if (is_array($reprojectConfig)) {
                $feature['geometry'] = $this->reprojectGeometry($feature['geometry'], $reprojectConfig['transformer']);
            }

            $metadata = $this->extractMetadata($feature);

            try {
                DB::transaction(function () use ($feature, $metadata, $dir, $sourceName, $userId, &$createdIds) {
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

                    $createdIds[] = $geo->id_geojson;
                });
            } catch (\Throwable $dbException) {
                $this->logIssue(sprintf(
                    'Gagal menyimpan fitur dari %s (record #%d): %s',
                    $origin,
                    $recordIndex,
                    $dbException->getMessage()
                ));
            }
        }

        if (empty($createdIds) && $hadReadError) {
            return $this->seedFromShapefileWithOgr($absolutePath, $sourceName, $userId, $dir, $origin);
        }

        return $createdIds;
    }

    private function seedReport(string $pdfPath, string $folderName, int $geojsonId, $publicDisk): void
    {
        $originalName = basename($pdfPath);
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $hash = substr(sha1($pdfPath), 0, 12);

        $fileName = $this->buildStorageFileName($baseName, $hash);
        $destPath = 'reports/' . $fileName;

        $existing = Report::withTrashed()->where('file_path', $destPath)->first();
        if ($existing) {
            return;
        }

        if (!$publicDisk->exists($destPath)) {
            $publicDisk->putFileAs('reports', new File($pdfPath), $fileName);
        }

        $nomor = $this->buildNomor($hash, $originalName);

        Report::create([
            'id_geojson' => $geojsonId,
            'file_path' => $destPath,
            'description' => $folderName . ' - ' . $originalName,
            'nomor' => $nomor,
            'sifat' => 'Biasa',
            'hal' => Str::limit('KKPR OSS - ' . $folderName, 255, ''),
            'kepada' => Str::limit($folderName, 255, ''),
        ]);
    }

    private function buildStorageFileName(string $baseName, string $hash): string
    {
        $slug = Str::slug($baseName, '-');
        if ($slug === '') {
            $slug = 'kkpr-pdf';
        }
        $slug = Str::limit($slug, 120, '');

        return "{$slug}-{$hash}.pdf";
    }

    private function buildNomor(string $hash, string $originalName): string
    {
        $digits = preg_replace('/\\D+/', '', $originalName);
        $prefix = $digits !== '' ? 'KKPR-' . $digits : 'KKPR';
        return $prefix . '-' . strtoupper(substr($hash, 0, 6));
    }

    private function createPlaceholderGeojson(string $folderName, int $userId, array $zipNames, array $shpNames): ?int
    {
        try {
            $properties = [
                'kkpr_folder' => $folderName,
                'kkpr_status' => 'no_valid_shp',
            ];
            if (!empty($zipNames)) {
                $properties['kkpr_zip_files'] = array_values(array_unique($zipNames));
            }
            if (!empty($shpNames)) {
                $properties['kkpr_shp_files'] = array_values(array_unique($shpNames));
            }

            $geo = Geojson::create([
                'geojson' => [
                    'type' => 'Feature',
                    'geometry' => null,
                    'properties' => $properties,
                ],
                'source_name' => $folderName,
                'id_user' => $userId ?: null,
                'id_region' => null,
                'id_owner' => null,
                'id_kategori' => null,
                'main_category' => 'KKPR',
                'properties_snapshot' => $properties,
                'geojson_bbox' => null,
            ]);

            return $geo->id_geojson;
        } catch (\Throwable $e) {
            $this->command?->warn("Gagal membuat placeholder GeoJSON untuk {$folderName}: {$e->getMessage()}");
            return null;
        }
    }

    private function extractMetadata(array $feature): array
    {
        $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
        $bbox = null;
        $geometry = $feature['geometry'] ?? null;

        if (is_array($geometry)) {
            $extents = $this->getCoordinateExtents($geometry);
            if ($extents) {
                $bbox = [
                    'min_lng' => $extents['min_x'],
                    'min_lat' => $extents['min_y'],
                    'max_lng' => $extents['max_x'],
                    'max_lat' => $extents['max_y'],
                ];
            }
        }

        return [
            'properties_snapshot' => $properties,
            'geojson_bbox' => $bbox,
        ];
    }

    private function getCoordinateExtents(array $geometry): ?array
    {
        if (!isset($geometry['coordinates']) || !is_array($geometry['coordinates'])) {
            return null;
        }

        $minX = $minY = $maxX = $maxY = null;

        $walk = function ($node) use (&$walk, &$minX, &$minY, &$maxX, &$maxY) {
            if (!is_array($node)) {
                return;
            }
            if (isset($node[0], $node[1]) && is_numeric($node[0]) && is_numeric($node[1])) {
                $x = (float) $node[0];
                $y = (float) $node[1];
                $minX = $minX === null ? $x : min($minX, $x);
                $maxX = $maxX === null ? $x : max($maxX, $x);
                $minY = $minY === null ? $y : min($minY, $y);
                $maxY = $maxY === null ? $y : max($maxY, $y);
                return;
            }
            foreach ($node as $child) {
                $walk($child);
            }
        };

        $walk($geometry['coordinates']);

        if ($minX === null) {
            return null;
        }

        return [
            'min_x' => $minX,
            'min_y' => $minY,
            'max_x' => $maxX,
            'max_y' => $maxY,
        ];
    }

    private function resolveReprojectionConfig(array $geometry, string $absolutePath, string $origin): ?array
    {
        $extents = $this->getCoordinateExtents($geometry);
        if (!$extents) {
            return null;
        }

        $maxAbsX = max(abs($extents['min_x']), abs($extents['max_x']));
        $maxAbsY = max(abs($extents['min_y']), abs($extents['max_y']));
        if ($maxAbsX <= 180 && $maxAbsY <= 90) {
            return null;
        }

        if (!$this->looksLikeUtm($extents)) {
            $this->logIssue(sprintf(
                'Koordinat tampak projected non-UTM pada %s (X %.2f..%.2f, Y %.2f..%.2f).',
                $origin,
                $extents['min_x'],
                $extents['max_x'],
                $extents['min_y'],
                $extents['max_y']
            ));
            return null;
        }

        $utm = $this->resolveUtmConfig($absolutePath);
        if (!$utm) {
            $this->logIssue("Tidak bisa menentukan zona UTM untuk {$origin}; lewati reproyeksi.");
            return null;
        }

        return [
            'zone' => $utm['zone'],
            'hemisphere' => $utm['hemisphere'],
            'transformer' => $this->buildUtmTransformer($utm['zone'], $utm['hemisphere']),
        ];
    }

    private function looksLikeUtm(array $extents): bool
    {
        if ($extents['min_x'] < 10000 || $extents['max_x'] > 1000000) {
            return false;
        }

        if ($extents['min_y'] < -1000000 || $extents['max_y'] > 10000000) {
            return false;
        }

        return true;
    }

    private function resolveUtmConfig(string $absolutePath): ?array
    {
        $zone = null;
        $hemisphere = null;

        $prjPath = $this->switchExtension($absolutePath, 'prj');
        if (is_file($prjPath)) {
            $prj = (string) @file_get_contents($prjPath);
            [$zone, $hemisphere] = $this->parseUtmFromPrj($prj);
        }

        $envZone = env('KKPR_OSS_UTM_ZONE');
        if ($zone === null && $envZone !== null && $envZone !== '') {
            $zone = (int) $envZone;
        }

        $envHem = env('KKPR_OSS_UTM_HEMISPHERE');
        if ($hemisphere === null && $envHem !== null && $envHem !== '') {
            $hemisphere = strtoupper(trim($envHem));
        }

        if ($zone === null) {
            $zone = 48;
        }
        if ($hemisphere === null) {
            $hemisphere = 'N';
        }

        $hemisphere = strtoupper($hemisphere);
        if ($zone < 1 || $zone > 60 || !in_array($hemisphere, ['N', 'S'], true)) {
            return null;
        }

        return [
            'zone' => $zone,
            'hemisphere' => $hemisphere,
        ];
    }

    private function parseUtmFromPrj(string $prj): array
    {
        if ($prj === '') {
            return [null, null];
        }

        $upper = strtoupper($prj);

        if (preg_match('/EPSG\\D*(326\\d{2}|327\\d{2})/', $upper, $match)) {
            $code = (int) $match[1];
            $zone = $code % 100;
            $hemisphere = $code >= 32700 ? 'S' : 'N';
            return [$zone, $hemisphere];
        }

        if (preg_match('/UTM\\s*ZONE\\s*(\\d{1,2})\\s*([NS])/', $upper, $match)) {
            return [(int) $match[1], $match[2]];
        }

        if (preg_match('/UTM[_ ]ZONE[_ ](\\d{1,2})([NS])/', $upper, $match)) {
            return [(int) $match[1], $match[2]];
        }

        return [null, null];
    }

    private function buildUtmTransformer(int $zone, string $hemisphere): callable
    {
        $zone = max(1, min(60, $zone));
        $hemisphere = strtoupper($hemisphere) === 'S' ? 'S' : 'N';

        $a = 6378137.0;
        $f = 1 / 298.257223563;
        $e = sqrt($f * (2 - $f));
        $eSq = $e * $e;
        $ePrimeSq = $eSq / (1 - $eSq);
        $k0 = 0.9996;
        $e1 = (1 - sqrt(1 - $eSq)) / (1 + sqrt(1 - $eSq));
        $lon0 = deg2rad(($zone - 1) * 6 - 180 + 3);

        return function (float $x, float $y) use ($a, $eSq, $ePrimeSq, $k0, $e1, $lon0, $hemisphere): array {
            $x = $x - 500000.0;
            if ($hemisphere === 'S') {
                $y -= 10000000.0;
            }

            $m = $y / $k0;
            $mu = $m / ($a * (1 - $eSq / 4 - 3 * $eSq * $eSq / 64 - 5 * $eSq * $eSq * $eSq / 256));
            $phi1 = $mu
                + (3 * $e1 / 2 - 27 * $e1 ** 3 / 32) * sin(2 * $mu)
                + (21 * $e1 ** 2 / 16 - 55 * $e1 ** 4 / 32) * sin(4 * $mu)
                + (151 * $e1 ** 3 / 96) * sin(6 * $mu)
                + (1097 * $e1 ** 4 / 512) * sin(8 * $mu);

            $sinPhi1 = sin($phi1);
            $cosPhi1 = cos($phi1);
            $tanPhi1 = tan($phi1);

            $n1 = $a / sqrt(1 - $eSq * $sinPhi1 * $sinPhi1);
            $t1 = $tanPhi1 * $tanPhi1;
            $c1 = $ePrimeSq * $cosPhi1 * $cosPhi1;
            $r1 = $a * (1 - $eSq) / pow(1 - $eSq * $sinPhi1 * $sinPhi1, 1.5);
            $d = $x / ($n1 * $k0);

            $lat = $phi1 - ($n1 * $tanPhi1 / $r1) * (
                $d * $d / 2
                - (5 + 3 * $t1 + 10 * $c1 - 4 * $c1 * $c1 - 9 * $ePrimeSq) * ($d ** 4) / 24
                + (61 + 90 * $t1 + 298 * $c1 + 45 * $t1 * $t1 - 252 * $ePrimeSq - 3 * $c1 * $c1) * ($d ** 6) / 720
            );

            $lon = $lon0 + (
                $d
                - (1 + 2 * $t1 + $c1) * ($d ** 3) / 6
                + (5 - 2 * $c1 + 28 * $t1 - 3 * $c1 * $c1 + 8 * $ePrimeSq + 24 * $t1 * $t1) * ($d ** 5) / 120
            ) / $cosPhi1;

            return [rad2deg($lon), rad2deg($lat)];
        };
    }

    private function reprojectGeometry(array $geometry, callable $transformer): array
    {
        if (isset($geometry['coordinates']) && is_array($geometry['coordinates'])) {
            $geometry['coordinates'] = $this->transformCoordinates($geometry['coordinates'], $transformer);
            if (isset($geometry['bbox'])) {
                $extents = $this->getCoordinateExtents($geometry);
                if ($extents) {
                    $geometry['bbox'] = [
                        $extents['min_x'],
                        $extents['min_y'],
                        $extents['max_x'],
                        $extents['max_y'],
                    ];
                } else {
                    unset($geometry['bbox']);
                }
            }
            return $geometry;
        }

        if (isset($geometry['geometries']) && is_array($geometry['geometries'])) {
            foreach ($geometry['geometries'] as $idx => $child) {
                if (is_array($child)) {
                    $geometry['geometries'][$idx] = $this->reprojectGeometry($child, $transformer);
                }
            }
        }

        return $geometry;
    }

    private function transformCoordinates($coords, callable $transformer)
    {
        if (!is_array($coords)) {
            return $coords;
        }

        if (isset($coords[0], $coords[1]) && is_numeric($coords[0]) && is_numeric($coords[1]) && !is_array($coords[0]) && !is_array($coords[1])) {
            [$lon, $lat] = $transformer((float) $coords[0], (float) $coords[1]);
            $extra = array_slice($coords, 2);
            return array_merge([$lon, $lat], $extra);
        }

        foreach ($coords as $index => $child) {
            $coords[$index] = $this->transformCoordinates($child, $transformer);
        }

        return $coords;
    }

    private function buildOgrCommand(string $ogr, string $outputPath, string $inputPath): string
    {
        return sprintf(
            '"%s" -f GeoJSON "%s" "%s" -skipfailures --config SHAPE_RESTORE_SHX YES -t_srs EPSG:4326',
            $ogr,
            $outputPath,
            $inputPath
        );
    }

    private function seedFromShapefileWithOgr(string $absolutePath, string $sourceName, int $userId, string $dir, string $origin): array
    {
        $ogr = $this->resolveOgr2OgrBinary();
        if (!$ogr) {
            $this->logIssue("ogr2ogr tidak ditemukan untuk membaca {$origin}");
            return [];
        }

        $tmp = tempnam(sys_get_temp_dir(), 'kkpr_ogr_');
        if ($tmp === false) {
            $this->command?->warn("Gagal membuat file sementara untuk {$absolutePath}");
            return [];
        }
        $geojsonPath = $tmp . '.json';
        @unlink($tmp);

        $cmd = $this->buildOgrCommand($ogr, $geojsonPath, $absolutePath);
        $output = [];
        $code = 0;
        @exec($cmd, $output, $code);

        if ($code !== 0 || !is_file($geojsonPath)) {
            $this->logIssue("ogr2ogr gagal untuk {$origin}");
            @unlink($geojsonPath);
            return [];
        }

        $raw = @file_get_contents($geojsonPath);
        @unlink($geojsonPath);
        $data = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($data)) {
            $this->logIssue("Hasil ogr2ogr tidak valid untuk {$origin}");
            return [];
        }

        $features = [];
        $type = $data['type'] ?? null;
        if ($type === 'FeatureCollection') {
            $features = is_array($data['features'] ?? null) ? $data['features'] : [];
        } elseif ($type === 'Feature') {
            $features = [$data];
        }

        if (empty($features)) {
            return [];
        }

        $createdIds = [];
        $reprojectResolved = false;
        $reprojectConfig = null;
        foreach ($features as $feature) {
            if (!is_array($feature)) {
                continue;
            }
            $feature['properties'] = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
            if (!is_array($feature['geometry'] ?? null)) {
                continue;
            }

            if (!$reprojectResolved) {
                $reprojectConfig = $this->resolveReprojectionConfig($feature['geometry'], $absolutePath, $origin);
                $reprojectResolved = true;
            }

            if (is_array($reprojectConfig)) {
                $feature['geometry'] = $this->reprojectGeometry($feature['geometry'], $reprojectConfig['transformer']);
            }

            $metadata = $this->extractMetadata($feature);

            try {
                DB::transaction(function () use ($feature, $metadata, $dir, $sourceName, $userId, &$createdIds) {
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

                    $createdIds[] = $geo->id_geojson;
                });
            } catch (\Throwable $dbException) {
                $this->logIssue(sprintf(
                    'Gagal menyimpan fitur ogr2ogr dari %s: %s',
                    $origin,
                    $dbException->getMessage()
                ));
            }
        }

        return $createdIds;
    }

    private function resolveOgr2OgrBinary(): ?string
    {
        $path = @shell_exec('where ogr2ogr');
        if (is_string($path)) {
            $lines = array_filter(array_map('trim', preg_split('/\\r?\\n/', $path)));
            if (!empty($lines)) {
                return $lines[0];
            }
        }

        $fallbacks = [
            'C:\\Program Files\\PostgreSQL\\17\\bin\\ogr2ogr.exe',
            'C:\\Program Files\\PostgreSQL\\16\\bin\\ogr2ogr.exe',
            'C:\\Program Files\\GDAL\\ogr2ogr.exe',
        ];

        foreach ($fallbacks as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
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

    private function sanitizeZipPath(string $entryName): string
    {
        $entryName = str_replace('\\', '/', $entryName);
        $parts = array_filter(explode('/', $entryName), fn($p) => $p !== '');
        $sanitizedParts = [];

        foreach ($parts as $part) {
            $clean = preg_replace('/[<>:"\\\\|?*]/', '_', $part);
            $clean = rtrim($clean, ". ");
            if ($clean === '') {
                continue;
            }
            $sanitizedParts[] = $clean;
        }

        return implode('/', $sanitizedParts);
    }

    private function logIssue(string $message): void
    {
        $this->command?->warn($message);
        try {
            $path = storage_path('app/private/kkpr_oss_invalid_shp.log');
            $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
            file_put_contents($path, $line, FILE_APPEND);
        } catch (\Throwable $e) {
        }
    }
}
