# Upload File Size Limit - Implementation Guide

## Overview

Sistem telah dikonfigurasi dengan validasi ukuran file maksimal **100MB** untuk upload GeoJSON, baik di client-side maupun server-side.

---

## 1. PHP Configuration

### File: `C:\Users\le\Documents\php\php.ini`

Konfigurasi PHP telah diupdate untuk mendukung upload hingga 120MB (buffer 20MB di atas limit aplikasi):

```ini
# Line 701
post_max_size=120M

# Line 853
upload_max_filesize=120M

# Line 407 (sudah ada sebelumnya)
max_execution_time=120

# Line 433 (sudah ada sebelumnya)
memory_limit=512M
```

### Restart PHP Service

Setelah mengubah `php.ini`, restart PHP service:

```bash
# XAMPP
- Stop Apache dari XAMPP Control Panel
- Start Apache kembali

# Atau restart Windows service jika menggunakan standalone PHP
net stop "Apache2.4"
net start "Apache2.4"
```

---

## 2. Backend Validation (Laravel)

### Custom Request Classes

#### `app/Http/Requests/StoreGeojsonRequest.php`

```php
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB in bytes

public function withValidator($validator)
{
    $validator->after(function ($validator) {
        if ($this->hasFile('geojson_file')) {
            $files = $this->file('geojson_file');
            $totalSize = 0;

            foreach ($files as $file) {
                $totalSize += $file->getSize();
            }

            if ($totalSize > self::MAX_TOTAL_SIZE) {
                $totalSizeMB = round($totalSize / (1024 * 1024), 2);
                $maxSizeMB = self::MAX_TOTAL_SIZE / (1024 * 1024);

                $validator->errors()->add(
                    'geojson_file',
                    "Total ukuran file ({$totalSizeMB} MB) melebihi batas maksimal {$maxSizeMB} MB."
                );
            }
        }
    });
}
```

**Features:**
- ✅ Validasi total ukuran semua file yang diupload
- ✅ Custom error message dengan info ukuran file
- ✅ Mendukung multiple file upload

#### `app/Http/Requests/UpdateGeojsonRequest.php`

```php
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB in bytes

public function withValidator($validator)
{
    $validator->after(function ($validator) {
        if ($this->hasFile('geojson_file')) {
            $file = $this->file('geojson_file');
            $fileSize = $file->getSize();

            if ($fileSize > self::MAX_TOTAL_SIZE) {
                $fileSizeMB = round($fileSize / (1024 * 1024), 2);
                $maxSizeMB = self::MAX_TOTAL_SIZE / (1024 * 1024);

                $validator->errors()->add(
                    'geojson_file',
                    "Ukuran file ({$fileSizeMB} MB) melebihi batas maksimal {$maxSizeMB} MB."
                );
            }
        }
    });
}
```

**Features:**
- ✅ Validasi ukuran single file
- ✅ Custom error message
- ✅ Untuk update single GeoJSON

### Controller Integration

#### `app/Http/Controllers/GeojsonController.php`

```php
use App\Http\Requests\StoreGeojsonRequest;
use App\Http\Requests\UpdateGeojsonRequest;

public function store(StoreGeojsonRequest $request)
{
    $validated = $request->validated();
    // ... rest of the code
}

public function update(UpdateGeojsonRequest $request, $id)
{
    $validated = $request->validated();
    // ... rest of the code
}
```

---

## 3. Frontend Validation (React/TypeScript)

### File: `resources/js/pages/geojson/create.tsx`

#### Helper Functions

```typescript
// Maximum total upload size (100MB)
const MAX_TOTAL_UPLOAD_SIZE_MB = 100;

// Validate total file size (100MB limit for bulk uploads)
const validateTotalFileSize = (fileList: FileList | File[]): { valid: boolean; totalSizeMB: number } => {
    const files = Array.from(fileList);
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalBytes / (1024 * 1024);

    return {
        valid: totalSizeMB <= MAX_TOTAL_UPLOAD_SIZE_MB,
        totalSizeMB: parseFloat(totalSizeMB.toFixed(2))
    };
};
```

#### File Input Handler

```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        // Validate total file size
        const sizeValidation = validateTotalFileSize(e.target.files);
        if (!sizeValidation.valid) {
            toast.error(
                `Total ukuran file (${sizeValidation.totalSizeMB} MB) melebihi batas maksimal ${MAX_TOTAL_UPLOAD_SIZE_MB} MB`
            );
            // Clear the input
            e.target.value = '';
            return;
        }

        setValue('geojson_file', e.target.files);
    }
};
```

#### Drag & Drop Handler

```typescript
const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
        // Filter only .geojson files
        const geojsonFiles = Array.from(droppedFiles).filter(file =>
            file.name.toLowerCase().endsWith('.geojson')
        );

        if (geojsonFiles.length === 0) {
            toast.error('Hanya file .geojson yang diperbolehkan');
            return;
        }

        // Combine with existing files if any
        const existingFiles = files ? Array.from(files) : [];
        const allFiles = [...existingFiles, ...geojsonFiles];

        // Validate total file size
        const sizeValidation = validateTotalFileSize(allFiles);
        if (!sizeValidation.valid) {
            toast.error(
                `Total ukuran file (${sizeValidation.totalSizeMB} MB) melebihi batas maksimal ${MAX_TOTAL_UPLOAD_SIZE_MB} MB`
            );
            return;
        }

        // Update file input via DataTransfer
        const dataTransfer = new DataTransfer();
        allFiles.forEach(file => dataTransfer.items.add(file));

        if (inputRef.current) {
            inputRef.current.files = dataTransfer.files;
        }

        setValue('geojson_file', dataTransfer.files);
        toast.success(`${geojsonFiles.length} file ditambahkan`);
    }
};
```

#### UI Indicator

```tsx
{fileList.length > 0 && (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                    {fileList.length} file dipilih
                </span>
                {(() => {
                    const validation = validateTotalFileSize(fileList);
                    return (
                        <span className={`text-xs ${
                            validation.valid
                                ? 'text-gray-500'
                                : 'text-red-600 font-semibold'
                        }`}>
                            Total: {validation.totalSizeMB} MB / {MAX_TOTAL_UPLOAD_SIZE_MB} MB
                        </span>
                    );
                })()}
            </div>
            <button
                type="button"
                onClick={handleRemoveAll}
                className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white"
            >
                Hapus Semua
            </button>
        </div>
    </div>
)}
```

---

## 4. Features Summary

### Client-Side (Frontend)
✅ **Pre-upload validation** - Mencegah upload sebelum sampai ke server
✅ **Real-time size indicator** - Menampilkan total ukuran file yang dipilih
✅ **Visual feedback** - Warna berubah jika melebihi limit
✅ **Toast notifications** - Error message yang jelas
✅ **Drag & drop support** - Validasi juga untuk drag & drop
✅ **Multiple file support** - Validasi total dari semua file

### Server-Side (Backend)
✅ **Request validation** - Custom request classes
✅ **Size calculation** - Menghitung total ukuran semua file
✅ **Error messages** - Pesan error yang informatif dengan ukuran file
✅ **Type safety** - Konstanta untuk max size
✅ **Separation of concerns** - Store dan Update request terpisah

### Infrastructure
✅ **PHP configuration** - post_max_size dan upload_max_filesize
✅ **Buffer capacity** - 120MB di PHP untuk 100MB limit aplikasi
✅ **Memory allocation** - 512MB memory_limit
✅ **Execution time** - 120 detik max_execution_time

---

## 5. Error Handling

### Client-Side Errors

**Scenario 1: Single file > 100MB**
```
❌ Total ukuran file (125.43 MB) melebihi batas maksimal 100 MB
```

**Scenario 2: Multiple files total > 100MB**
```
❌ Total ukuran file (215.53 MB) melebihi batas maksimal 100 MB
```

**Scenario 3: Adding files that exceed limit**
```
❌ Total ukuran file (150.21 MB) melebihi batas maksimal 100 MB
(File tidak ditambahkan, input di-clear)
```

### Server-Side Errors

**Store (Multiple Files)**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "geojson_file": [
            "Total ukuran file (215.53 MB) melebihi batas maksimal 100 MB."
        ]
    }
}
```

**Update (Single File)**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "geojson_file": [
            "Ukuran file (125.43 MB) melebihi batas maksimal 100 MB."
        ]
    }
}
```

---

## 6. Testing

### Test Cases

#### ✅ Test 1: Upload single file < 100MB
- **Input:** 1 file @ 50MB
- **Expected:** ✅ Success - File uploaded

#### ✅ Test 2: Upload single file > 100MB
- **Input:** 1 file @ 125MB
- **Expected:** ❌ Error - Client blocks before upload

#### ✅ Test 3: Upload multiple files total < 100MB
- **Input:** 5 files @ 15MB each = 75MB total
- **Expected:** ✅ Success - All files uploaded

#### ✅ Test 4: Upload multiple files total > 100MB
- **Input:** 6 files @ 36MB each = 216MB total
- **Expected:** ❌ Error - Client blocks before upload

#### ✅ Test 5: Add files via drag & drop exceeding limit
- **Input:** Existing 50MB + drop 60MB = 110MB total
- **Expected:** ❌ Error - New files not added

#### ✅ Test 6: PHP limit bypass attempt
- **Input:** Disable JS, upload 150MB directly
- **Expected:** ❌ Error - Server validation blocks

---

## 7. Configuration Changes

### How to Change the Limit

#### Backend (100MB → 200MB)

**1. Update Request Classes**
```php
// app/Http/Requests/StoreGeojsonRequest.php
// app/Http/Requests/UpdateGeojsonRequest.php
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
```

**2. Update PHP Configuration**
```ini
# C:\Users\le\Documents\php\php.ini
post_max_size=240M         # 200MB + 20% buffer
upload_max_filesize=240M
```

**3. Restart PHP Service**

#### Frontend (100MB → 200MB)

```typescript
// resources/js/pages/geojson/create.tsx
const MAX_TOTAL_UPLOAD_SIZE_MB = 200;
```

**Rebuild assets:**
```bash
npm run build
```

---

## 8. Monitoring

### Log Upload Attempts

Tambahkan logging di controller (optional):

```php
use Illuminate\Support\Facades\Log;

public function store(StoreGeojsonRequest $request)
{
    if ($request->hasFile('geojson_file')) {
        $files = $request->file('geojson_file');
        $totalSize = collect($files)->sum(fn($f) => $f->getSize());

        Log::info('GeoJSON Upload', [
            'user_id' => Auth::id(),
            'file_count' => count($files),
            'total_size_mb' => round($totalSize / (1024 * 1024), 2)
        ]);
    }

    // ... rest of the code
}
```

---

## 9. Known Limitations

1. **Browser Memory:** File besar (>100MB) mungkin lambat di browser untuk preview
2. **Network Timeout:** Upload 100MB bisa timeout di koneksi lambat
3. **Processing Time:** File besar membutuhkan waktu processing lebih lama

### Solutions

1. **Chunked Upload:** Implementasi chunked upload untuk file >100MB
2. **Background Jobs:** Process large files menggunakan queues
3. **Progress Bar:** Tampilkan upload progress untuk UX lebih baik

---

## 10. Files Modified

```
Backend:
✅ C:\Users\le\Documents\php\php.ini
✅ app/Http/Requests/StoreGeojsonRequest.php (NEW)
✅ app/Http/Requests/UpdateGeojsonRequest.php (NEW)
✅ app/Http/Controllers/GeojsonController.php

Frontend:
✅ resources/js/pages/geojson/create.tsx
```

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
**Author:** Claude Code
