# GeoJSON Converter Features

## File Size Handling

### Batasan Ukuran File

Untuk menghindari masalah performa pada browser, sistem memiliki batasan untuk file yang dapat langsung digunakan di form:

- **File ≤ 10MB**: ✅ Dapat menggunakan tombol "Gunakan" dan "Gunakan Semua"
- **File > 10MB**: ⚠️ Hanya dapat di-download, tidak bisa langsung digunakan

### Fitur yang Ditambahkan

#### 1. Indikator Ukuran File
Setiap file hasil konversi menampilkan ukuran dalam MB:
```
filename.geojson (2.45 MB)
```

#### 2. Warning untuk File Besar
File yang lebih dari 10MB akan menampilkan peringatan:
```
⚠️ File lebih dari 10MB, hanya bisa download
```

#### 3. Tombol "Gunakan" Conditional
- **File ≤ 10MB**: Tombol "Gunakan" ditampilkan
- **File > 10MB**: Tombol "Gunakan" disembunyikan, hanya tombol "Download" yang tersedia

#### 4. Tombol "Gunakan Semua" Conditional
- Hanya muncul jika **semua file** ≤ 10MB
- Jika ada minimal 1 file > 10MB, tombol "Gunakan Semua" akan disembunyikan

#### 5. Tombol "Download Semua"
Tombol baru yang selalu tersedia untuk:
- Download semua file hasil konversi sekaligus
- Bekerja untuk file berapapun ukurannya
- Menampilkan notifikasi jumlah file yang berhasil di-download

### Use Cases

#### Single File Conversion

**Skenario 1: File Kecil (≤ 10MB)**
```
✅ SHP POLA RUANG BINTAN/RDTR_BSB.geojson (2.45 MB)
[Gunakan] [Download]
```

**Skenario 2: File Besar (> 10MB)**
```
⚠️ SHP POLA RUANG BINTAN/RDTR_UBAN.geojson (15.32 MB)
⚠️ File lebih dari 10MB, hanya bisa download
[Download]
```

#### Multiple Files Conversion

**Skenario 1: Semua File Kecil**
```
5 file GeoJSON berhasil dikonversi
[Gunakan Semua] [Download Semua] [Clear]

✅ RDTR_BSB.geojson (2.45 MB)      [Gunakan] [Download]
✅ RDTR_UBAN.geojson (3.21 MB)     [Gunakan] [Download]
✅ RDTR_KUSEM.geojson (1.87 MB)    [Gunakan] [Download]
```

**Skenario 2: Ada File Besar**
```
5 file GeoJSON berhasil dikonversi
⚠️ 2 file lebih dari 10MB
[Download Semua] [Clear]

✅ RDTR_BSB.geojson (2.45 MB)        [Gunakan] [Download]
⚠️ RDTR_UBAN.geojson (15.32 MB)     [Download]
   ⚠️ File lebih dari 10MB, hanya bisa download
✅ RDTR_KUSEM.geojson (3.21 MB)      [Gunakan] [Download]
⚠️ RDTR_KIJANG.geojson (12.88 MB)   [Download]
   ⚠️ File lebih dari 10MB, hanya bisa download
```

## Technical Implementation

### Helper Functions

```typescript
// Calculate file size in MB
const getFileSizeInMB = (data: any): number => {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    return sizeInBytes / (1024 * 1024);
};

// Check if file is too large
const isFileTooLarge = (data: any): boolean => {
    return getFileSizeInMB(data) > 10;
};

// Download all files
const handleDownloadAllGeoJSON = () => {
    if (previewGeojsons.length > 0) {
        previewGeojsons.forEach(({ filename, data }) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            saveAs(blob, filename);
        });
        toast.success(`${previewGeojsons.length} file berhasil didownload`);
    }
};
```

### UI Logic

```tsx
{/* Conditional "Gunakan" button */}
{!isFileTooLarge(shpGeojson) && (
    <button onClick={() => handleUseConvertedGeoJSON(...)}>
        Gunakan
    </button>
)}

{/* Conditional "Gunakan Semua" button */}
{!previewGeojsons.some(file => isFileTooLarge(file.data)) && (
    <button onClick={handleUseAllConvertedGeoJSON}>
        Gunakan Semua
    </button>
)}

{/* Always available "Download Semua" */}
<button onClick={handleDownloadAllGeoJSON}>
    Download Semua
</button>
```

## Benefits

1. **Performa**: Mencegah browser hang saat memproses file besar
2. **User Experience**: User tahu kapan harus download vs gunakan langsung
3. **Fleksibilitas**: Tetap bisa download file besar untuk diproses secara terpisah
4. **Clarity**: Warning yang jelas untuk file yang melebihi batas

## Future Improvements

Potensi enhancement di masa depan:
1. Threshold ukuran bisa dikonfigurasi (saat ini hardcode 10MB)
2. Compress data sebelum "Gunakan" untuk file mendekati batas
3. Chunk processing untuk file besar
4. Progress bar untuk download multiple files
5. ZIP download untuk multiple files

---

**Last Updated**: 2025-11-17
