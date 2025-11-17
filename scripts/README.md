# ArcGIS Style Converter

Script untuk mengkonversi file ArcGIS Style (.style) ke format JSON yang dapat digunakan di aplikasi web.

## Tentang File .style

File `.style` dari ArcGIS adalah database Microsoft Access (Jet DB) yang berisi koleksi simbol-simbol untuk pemetaan, termasuk:

- **Fill Symbols** - Simbol untuk fill/isian polygon
- **Line Symbols** - Simbol untuk garis
- **Marker Symbols** - Simbol untuk titik/marker
- **Text Symbols** - Simbol untuk teks
- **Color Ramps** - Gradasi warna
- Dan lainnya

## Prerequisites

```bash
npm install mdb-reader
```

## Cara Penggunaan

### 1. Extract Style Symbols (Recommended)

Script ini mengekstrak metadata simbol (nama, kategori, tags) tanpa data binary:

```bash
node scripts/extractStyleSymbols.js
```

**Output:**
- `style-output/complete-style.json` - Semua simbol digabung
- `style-output/summary.json` - Ringkasan dan overview
- `style-output/Fill Symbols.json` - Simbol polygon
- `style-output/Line Symbols.json` - Simbol garis
- `style-output/Marker Symbols.json` - Simbol marker
- Dan file lainnya untuk setiap tipe simbol

### 2. Full Conversion (Advanced)

Script ini mengkonversi seluruh database termasuk data binary:

```bash
node scripts/convertStyleToJson.js
```

**Output:**
- `arcgis-style.json` - Full database dalam format JSON

## Struktur Output JSON

### Summary Format

```json
{
  "metadata": {
    "sourceFile": "Simbolisasi (1).style",
    "extractedDate": "2025-11-17T04:12:34.021Z",
    "totalTables": 23
  },
  "summary": {
    "Fill Symbols": {
      "count": 182,
      "categories": ["Pola Ruang", "Kawasan Strategis", ...]
    },
    "Line Symbols": {
      "count": 90,
      "categories": ["Jaringan Transportasi", ...]
    },
    "Marker Symbols": {
      "count": 130,
      "categories": ["Jaringan Prasarana Lainnya", ...]
    }
  }
}
```

### Symbol Item Format

```json
{
  "id": 1,
  "name": "Badan Air",
  "category": "Pola Ruang",
  "tags": "rgb;simple;blue"
}
```

## Hasil Ekstraksi dari "Simbolisasi (1).style"

File style yang di-convert berisi:

### Fill Symbols (182 items)
Kategori:
- Pola Ruang
- Kawasan Strategis
- Ketentuan Tambahan
- Ketentuan Khusus

Contoh: Badan Air, Badan Jalan, Cagar Alam, Cagar Budaya, dll.

### Line Symbols (90 items)
Kategori:
- Jaringan Transportasi
- Jaringan Prasarana Lainnya
- Jaringan Energi
- Jaringan Sumber Daya Air
- Jaringan Telekomunikasi

Contoh: Alur Pelayaran, Jaringan Jalan, Pipa Gas, Kabel Listrik, dll.

### Marker Symbols (130 items)
Kategori:
- Jaringan Prasarana Lainnya
- Jaringan Transportasi
- Jaringan Sumber Daya Air
- Jaringan Energi
- Jaringan Telekomunikasi
- Sistem Pusat Permukiman

Contoh: Bandar Udara, Pelabuhan, SPBU, Gardu Listrik, dll.

## Penggunaan di Aplikasi Web

### 1. Load Symbol Metadata

```javascript
import fillSymbols from './style-output/Fill Symbols.json';

// Get all symbols in a category
const polaRuangSymbols = fillSymbols.items.filter(
  item => item.category === 'Pola Ruang'
);

// Find symbol by name
const badanAir = fillSymbols.items.find(
  item => item.name === 'Badan Air'
);
```

### 2. Create Symbol Mapping

```javascript
// Create a lookup map
const symbolMap = new Map();
fillSymbols.items.forEach(symbol => {
  symbolMap.set(symbol.name, {
    id: symbol.id,
    category: symbol.category,
    tags: symbol.tags.split(';')
  });
});

// Use in your GIS application
const symbolInfo = symbolMap.get('Badan Air');
```

### 3. Category-based Filtering

```javascript
import summary from './style-output/summary.json';

// Get all available categories
const fillCategories = summary.summary['Fill Symbols'].categories;
const lineCategories = summary.summary['Line Symbols'].categories;
const markerCategories = summary.summary['Marker Symbols'].categories;
```

## Catatan

1. **Binary Data**: Data binary objek simbol (warna, pattern, dll) tidak di-extract dalam mode default. Untuk mendapatkan data visual simbol, gunakan `convertStyleToJson.js`.

2. **Color Information**: Informasi warna ada dalam tags (contoh: "rgb;simple;blue"). Untuk mendapatkan nilai RGB exact, perlu parsing binary object.

3. **Tags**: Tags berisi informasi tentang tipe simbol:
   - `rgb` - menggunakan RGB color
   - `simple` - simbol sederhana
   - `multilayer` - simbol multi-layer
   - `cartographic` - simbol kartografis

## Customisasi

Edit konstanta `STYLE_FILE` dan `OUTPUT_DIR` di script untuk mengubah input/output:

```javascript
const STYLE_FILE = 'nama-file-anda.style';
const OUTPUT_DIR = 'output-folder';
```

## Troubleshooting

### Error: "Cannot read .style file"
- Pastikan file .style ada di root folder project
- Pastikan file tidak corrupt
- Coba buka file di ArcGIS untuk validasi

### Empty Tables
- Beberapa tabel mungkin kosong jika tidak digunakan dalam style
- Check summary.json untuk melihat tabel mana yang berisi data

### Large File Size
- File JSON bisa besar jika banyak simbol
- Gunakan `extractStyleSymbols.js` untuk output yang lebih kecil
- Compress JSON dengan gzip untuk production

## Lisensi

Script ini untuk internal use dalam project GIS PUPRP.
