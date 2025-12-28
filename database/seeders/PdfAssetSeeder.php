<?php

namespace Database\Seeders;

use App\Models\Geojson;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfAssetSeeder extends Seeder
{
    private const DEFAULT_SOURCE_DIRECTORY = 'C:\\Users\\le\\Documents\\SHAREit\\2203129G\\file';
    private const PLACEHOLDER_SOURCE_NAME = 'PDF_ASSET_IMPORT';

    public function run(): void
    {
        $sourceDirectory = env('PDF_ASSET_IMPORT_PATH', self::DEFAULT_SOURCE_DIRECTORY);

        $userId = User::where('role', 'superadmin')->value('id') ?? User::query()->value('id');
        if (!$userId) {
            $this->command?->error('PdfAssetSeeder stopped: no users found for id_user.');
            return;
        }

        $files = $this->discoverPdfFiles($sourceDirectory);
        if (empty($files)) {
            $this->command?->warn("No PDF files found in {$sourceDirectory}.");
            return;
        }

        $placeholder = $this->getOrCreatePlaceholderGeojson($userId);
        $disk = Storage::disk('public');
        $disk->makeDirectory('reports');

        foreach ($files as $path) {
            $originalName = basename($path);
            $baseName = pathinfo($originalName, PATHINFO_FILENAME);
            $relative = $this->relativePath($path, $sourceDirectory);
            $hash = substr(sha1($relative), 0, 12);

            $fileName = $this->buildStorageFileName($baseName, $hash);
            $destPath = 'reports/' . $fileName;

            $existing = Report::withTrashed()->where('file_path', $destPath)->first();
            if ($existing) {
                continue;
            }

            if (!$disk->exists($destPath)) {
                $disk->putFileAs('reports', new File($path), $fileName);
            }

            [$hal, $kepada] = $this->extractMetadata($baseName);
            $geojsonId = $this->resolveGeojsonId($baseName, $placeholder->id_geojson);

            Report::create([
                'id_geojson' => $geojsonId,
                'file_path' => $destPath,
                'description' => $originalName,
                'nomor' => $this->buildNomor($hash),
                'sifat' => 'Biasa',
                'hal' => Str::limit($hal, 255, ''),
                'kepada' => Str::limit($kepada, 255, ''),
            ]);
        }
    }

    private function discoverPdfFiles(string $directory): array
    {
        if (!is_dir($directory)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS)
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

    private function getOrCreatePlaceholderGeojson(int $userId): Geojson
    {
        return Geojson::firstOrCreate(
            ['source_name' => self::PLACEHOLDER_SOURCE_NAME],
            [
                'geojson' => [
                    'type' => 'Feature',
                    'geometry' => null,
                    'properties' => [
                        'source' => 'pdf-import',
                    ],
                ],
                'id_user' => $userId,
                'properties_snapshot' => [
                    'source' => 'pdf-import',
                ],
            ]
        );
    }

    private function resolveGeojsonId(string $sourceName, int $fallbackId): int
    {
        $matched = Geojson::where('source_name', $sourceName)->value('id_geojson');
        return $matched ?: $fallbackId;
    }

    private function buildStorageFileName(string $baseName, string $hash): string
    {
        $slug = Str::slug($baseName, '-');
        if ($slug === '') {
            $slug = 'pdf';
        }
        $slug = Str::limit($slug, 120, '');

        return "{$slug}-{$hash}.pdf";
    }

    private function buildNomor(string $hash): string
    {
        return 'PDF-' . strtoupper(substr($hash, 0, 8));
    }

    private function relativePath(string $path, string $base): string
    {
        $normalizedPath = str_replace('\\', '/', $path);
        $normalizedBase = rtrim(str_replace('\\', '/', $base), '/');

        if (Str::startsWith($normalizedPath, $normalizedBase)) {
            $relative = substr($normalizedPath, strlen($normalizedBase));
            return ltrim($relative, '/');
        }

        return basename($path);
    }

    private function extractMetadata(string $baseName): array
    {
        $clean = trim($baseName);
        $hal = $clean;
        $kepada = 'Tidak diketahui';

        if (preg_match('/^(.*)\\ba\\.?\\s*n\\.?\\s*(.+)$/i', $clean, $matches)) {
            $hal = trim($matches[1]) !== '' ? trim($matches[1]) : $clean;
            $kepada = $this->normalizeRecipient($matches[2]);
        }

        return [$hal, $kepada];
    }

    private function normalizeRecipient(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/\\s*\\(\\d+\\)\\s*$/', '', $value);
        return trim($value) !== '' ? trim($value) : 'Tidak diketahui';
    }
}
