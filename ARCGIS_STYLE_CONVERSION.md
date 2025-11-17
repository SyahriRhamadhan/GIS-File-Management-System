# ArcGIS Style Conversion - Complete Documentation

Dokumentasi lengkap untuk konversi file ArcGIS Style (.style) ke JSON dan penggunaannya dalam aplikasi GIS berbasis web.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [File Structure](#file-structure)
4. [Conversion Results](#conversion-results)
5. [Usage in Application](#usage-in-application)
6. [API Documentation](#api-documentation)

---

## 🎯 Overview

### Apa itu File .style?

File `.style` dari ArcGIS adalah database Microsoft Access (Jet DB) yang menyimpan koleksi simbol untuk visualisasi peta, termasuk:

- **Fill Symbols** - Simbol untuk area/polygon (182 items)
- **Line Symbols** - Simbol untuk garis (90 items)
- **Marker Symbols** - Simbol untuk titik/marker (130 items)
- Color Ramps, Text Symbols, dan lainnya

### Kenapa Perlu Konversi?

1. **Web Compatibility** - File .style tidak bisa dibaca langsung di browser
2. **Metadata Access** - Mendapatkan informasi nama, kategori, tags simbol
3. **Integration** - Integrasi dengan React/TypeScript/Leaflet
4. **Performance** - JSON lebih cepat untuk web application

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

Library yang dibutuhkan:
- `mdb-reader` - Untuk membaca Microsoft Access Database

### 2. Run Conversion

```bash
# Extract symbol metadata (recommended)
npm run convert:style

# Full database conversion (advanced)
npm run convert:style-full
```

### 3. Check Output

Output akan tersimpan di folder `style-output/`:

```
style-output/
├── summary.json                 # Ringkasan
├── complete-style.json         # Semua simbol
├── Fill Symbols.json           # 182 simbol polygon
├── Line Symbols.json           # 90 simbol garis
└── Marker Symbols.json         # 130 simbol marker
```

### 4. Copy to Public (for web access)

```bash
# Windows
xcopy style-output public\style-output\ /E /I

# Linux/Mac
cp -r style-output public/
```

---

## 📁 File Structure

```
gis/
├── scripts/
│   ├── extractStyleSymbols.js       # Main converter script
│   ├── convertStyleToJson.js        # Full conversion script
│   └── README.md                    # Scripts documentation
│
├── resources/js/
│   ├── hooks/
│   │   └── use-style-symbols.ts     # React hooks for symbols
│   ├── utils/
│   │   └── arcgisStyleUtils.ts      # Utility functions
│   └── components/
│       └── StyleSymbolPicker.tsx    # Symbol picker component
│
├── style-output/                    # Conversion output
│   ├── summary.json
│   ├── Fill Symbols.json
│   ├── Line Symbols.json
│   └── Marker Symbols.json
│
├── public/
│   └── style-output/                # Public web access
│
├── Simbolisasi (1).style            # Source file
├── ARCGIS_STYLE_CONVERSION.md       # This file
├── STYLE_USAGE_GUIDE.md             # Usage guide
└── package.json
```

---

## 📊 Conversion Results

### Dari File: "Simbolisasi (1).style"

#### Fill Symbols (182 items)

**Kategori:**
- Pola Ruang
- Kawasan Strategis
- Ketentuan Tambahan
- Ketentuan Khusus

**Contoh Simbol:**
- Badan Air
- Badan Jalan
- Cagar Alam
- Cagar Budaya
- Hutan Lindung
- Kawasan Industri
- Permukiman
- Pertanian
- dll.

#### Line Symbols (90 items)

**Kategori:**
- Jaringan Transportasi
- Jaringan Prasarana Lainnya
- Jaringan Energi
- Jaringan Sumber Daya Air
- Jaringan Telekomunikasi

**Contoh Simbol:**
- Alur Pelayaran
- Jaringan Jalan Arteri
- Jaringan Jalan Kolektor
- Pipa Gas
- Kabel Listrik Tegangan Tinggi
- Saluran Irigasi
- dll.

#### Marker Symbols (130 items)

**Kategori:**
- Jaringan Prasarana Lainnya
- Jaringan Transportasi
- Jaringan Sumber Daya Air
- Jaringan Energi
- Jaringan Telekomunikasi
- Sistem Pusat Permukiman

**Contoh Simbol:**
- Bandar Udara (berbagai kelas)
- Pelabuhan (Internasional, Nasional, Regional)
- SPBU
- Gardu Listrik
- PLTA, PLTU, PLTB
- Terminal
- dll.

### JSON Structure

#### Summary Format
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
    }
  }
}
```

#### Symbol Item Format
```json
{
  "id": 1,
  "name": "Badan Air",
  "category": "Pola Ruang",
  "tags": "rgb;simple;blue",
  "hasObjectData": true,
  "objectSize": 1234
}
```

---

## 💻 Usage in Application

### Loading Symbols

```tsx
import { useStyleSymbols } from '@/hooks/use-style-symbols';

function MyMap() {
    const { symbols, loading, categories } = useStyleSymbols('fill');

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2>Fill Symbols: {symbols.length}</h2>
            {/* Use symbols here */}
        </div>
    );
}
```

### Searching & Filtering

```tsx
import { searchSymbols, getSymbolsByCategory } from '@/utils/arcgisStyleUtils';

// Search
const results = searchSymbols(symbols, 'badan air');

// Filter by category
const polaRuang = getSymbolsByCategory(symbols, 'Pola Ruang');
```

### Symbol Picker Component

```tsx
import { StyleSymbolPicker } from '@/components/StyleSymbolPicker';

<StyleSymbolPicker
    symbols={fillSymbols}
    symbolType="fill"
    onSymbolSelect={(symbol) => console.log(symbol)}
    selectedSymbolId={selectedId}
/>
```

Lihat [STYLE_USAGE_GUIDE.md](./STYLE_USAGE_GUIDE.md) untuk dokumentasi lengkap.

---

## 📚 API Documentation

### Utility Functions

```typescript
// Search
searchSymbols(symbols, query)

// Filter
getSymbolsByCategory(symbols, category)
getSymbolsByTag(symbols, tag)

// Group
groupSymbolsByCategory(symbols)

// Find
findSymbolByName(symbols, name)
getCategories(symbols)

// Info
formatSymbolForDisplay(symbol)
getSymbolType(symbol)
getColorFromTags(symbol)
isMultilayerSymbol(symbol)

// Stats
getSymbolStats(symbols)

// Map
createSymbolMap(symbols)
```

### React Hooks

```typescript
// Load single type
useStyleSymbols(type: 'fill' | 'line' | 'marker')

// Load all types
useAllStyleSymbols()

// Selection management
useSymbolSelection<T>()
```

### TypeScript Types

```typescript
interface StyleSymbol {
    id: number;
    name: string;
    category?: string;
    tags?: string;
    hasObjectData?: boolean;
    objectSize?: number;
}

interface StyleTable {
    table: string;
    count: number;
    items: StyleSymbol[];
}
```

---

## 🛠️ NPM Scripts

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production

# Style Conversion
npm run convert:style      # Extract symbol metadata
npm run convert:style-full # Full database conversion

# Code Quality
npm run lint              # Lint and fix
npm run types             # Type check
npm run format            # Format code
```

---

## 📝 Notes & Limitations

### Current Implementation

✅ **What's Included:**
- Symbol metadata (id, name, category, tags)
- All symbol types (fill, line, marker)
- Search and filtering utilities
- React components and hooks
- TypeScript support

⚠️ **Limitations:**
- Color information is basic (from tags only)
- Binary symbol objects not fully parsed
- Visual rendering requires additional work
- Some categories have trailing spaces (need cleanup)

### For Exact Visual Symbols

Untuk mendapatkan rendering visual yang exact sesuai ArcGIS:

1. Parse binary `Object` field yang berisi serialized symbol data
2. Implement ArcGIS symbol renderer (complex)
3. Atau: gunakan alternatif seperti Simple Style Spec atau Mapbox GL Style

### Recommended Approach

Untuk aplikasi web, lebih praktis:
1. Gunakan metadata (name, category) untuk identifikasi
2. Buat symbol style sendiri yang sesuai kebutuhan web
3. Map nama symbol ArcGIS ke style definition web (Leaflet/Mapbox)

---

## 🔧 Customization

### Modify Source File

Edit di `scripts/extractStyleSymbols.js`:

```javascript
const STYLE_FILE = 'your-file.style';
const OUTPUT_DIR = 'your-output';
```

### Add Custom Symbol Tables

Tambahkan nama tabel di array `SYMBOL_TABLES`:

```javascript
const SYMBOL_TABLES = [
    'Fill Symbols',
    'Line Symbols',
    // Add more...
];
```

### Extend Utility Functions

Tambahkan function di `resources/js/utils/arcgisStyleUtils.ts`

---

## 🆘 Troubleshooting

### File Not Found
```
Error: Cannot read .style file
```
**Solution:** Pastikan file `Simbolisasi (1).style` ada di root folder

### Empty Output
```
All tables show 0 items
```
**Solution:** Check table names, mungkin file berbeda struktur

### Import Error in React
```
Cannot find module '@/utils/arcgisStyleUtils'
```
**Solution:** Check tsconfig paths dan file location

---

## 📖 Additional Resources

- [scripts/README.md](./scripts/README.md) - Script documentation
- [STYLE_USAGE_GUIDE.md](./STYLE_USAGE_GUIDE.md) - Complete usage guide
- [ArcGIS Style Documentation](https://pro.arcgis.com/en/pro-app/latest/help/mapping/layer-properties/styles.htm)

---

## 📄 License

Internal use - PUPRP GIS Project

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
