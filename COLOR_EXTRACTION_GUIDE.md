# ArcGIS Style - Color Extraction Guide

## 🎨 Informasi Warna yang Diekstrak

Warna berhasil diekstrak dari **tags** dalam file ArcGIS Style dan dipetakan ke nilai RGB standar.

### Hasil Ekstraksi

```
✅ Fill Symbols:   164/182 symbols dengan warna (90%)
✅ Line Symbols:    85/90  symbols dengan warna (94%)
✅ Marker Symbols: 130/130 symbols dengan warna (100%)
```

---

## 📊 Color Palette

### 10 Warna Utama yang Digunakan

| Warna | Hex | RGB | Fill | Line | Marker | Total |
|-------|-----|-----|------|------|--------|-------|
| Blue | `#0000ff` | (0, 0, 255) | 41 | 18 | 23 | **82** |
| Orange | `#ffa500` | (255, 165, 0) | 21 | 27 | 18 | **66** |
| Green | `#00ff00` | (0, 255, 0) | 36 | 7 | 11 | **54** |
| White | `#ffffff` | (255, 255, 255) | 0 | 1 | 42 | **43** |
| Red | `#ff0000` | (255, 0, 0) | 19 | 12 | 6 | **37** |
| Gray | `#808080` | (128, 128, 128) | 13 | 6 | 4 | **23** |
| Black | `#000000` | (0, 0, 0) | 0 | 5 | 18 | **23** |
| Purple | `#800080` | (128, 0, 128) | 15 | 5 | 1 | **21** |
| Yellow | `#ffff00` | (255, 255, 0) | 11 | 2 | 3 | **16** |
| Pink | `#ffc0cb` | (255, 192, 203) | 8 | 2 | 4 | **14** |

---

## 🔧 Cara Menggunakan

### 1. Extract Colors

```bash
npm run convert:colors
```

Output:
- `fill-symbols-with-colors.json` - Fill symbols dengan RGB
- `line-symbols-with-colors.json` - Line symbols dengan RGB
- `marker-symbols-with-colors.json` - Marker symbols dengan RGB
- `style-color-palette.json` - Palette lengkap
- `color-summary.json` - Statistik penggunaan warna

### 2. Load Symbols dengan Warna di React

```tsx
import fillSymbols from '@/data/fill-symbols-with-colors.json';

function MapComponent() {
    // Symbol dengan warna
    fillSymbols.symbols.forEach(symbol => {
        if (symbol.color) {
            console.log(`${symbol.name}: ${symbol.color.hex}`);
            // RGB available: symbol.color.r, symbol.color.g, symbol.color.b
        }
    });
}
```

### 3. Apply Warna ke Leaflet Layer

```tsx
import L from 'leaflet';

function applyStyleToLayer(layer: L.Path, symbol: any) {
    if (symbol.color) {
        layer.setStyle({
            color: symbol.color.hex,
            fillColor: symbol.color.hex,
            fillOpacity: 0.5,
            weight: 2
        });
    }
}
```

### 4. Create Legend dengan Warna

```tsx
import colorSummary from '@/data/color-summary.json';

function ColorLegend() {
    return (
        <div>
            <h3>Color Palette</h3>
            {Object.entries(colorSummary.colors).map(([name, data]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            backgroundColor: data.hex,
                            marginRight: 8,
                            border: '1px solid #ccc'
                        }}
                    />
                    <span>{name} ({data.hex})</span>
                    <span style={{ marginLeft: 'auto' }}>
                        Used {data.usedIn.fill + data.usedIn.line + data.usedIn.marker}x
                    </span>
                </div>
            ))}
        </div>
    );
}
```

---

## 📝 Format Data

### Symbol dengan Warna

```json
{
  "id": 1,
  "name": "Badan Air",
  "category": "Pola Ruang",
  "tags": "rgb;simple;blue",
  "color": {
    "r": 0,
    "g": 0,
    "b": 255,
    "hex": "#0000ff",
    "source": "tag",
    "tagName": "blue"
  }
}
```

### Color Summary

```json
{
  "totalColors": 10,
  "colors": {
    "blue": {
      "hex": "#0000ff",
      "rgb": { "r": 0, "g": 0, "b": 255 },
      "usedIn": {
        "fill": 41,
        "line": 18,
        "marker": 23
      },
      "examples": [
        {
          "name": "Badan Air",
          "type": "fill",
          "category": "Pola Ruang"
        }
      ]
    }
  }
}
```

---

## 🎯 Contoh Penggunaan Praktis

### 1. Filter Symbols by Color

```tsx
import { useMemo } from 'react';
import fillSymbols from '@/data/fill-symbols-with-colors.json';

function useSymbolsByColor(colorName: string) {
    return useMemo(() => {
        return fillSymbols.symbols.filter(
            s => s.color?.tagName === colorName
        );
    }, [colorName]);
}

// Usage
const blueSymbols = useSymbolsByColor('blue');
// Returns: Badan Air, Cagar Alam, Cagar Alam Laut, dll.
```

### 2. Group Symbols by Color

```tsx
function groupByColor(symbols: any[]) {
    return symbols.reduce((acc, symbol) => {
        const colorName = symbol.color?.tagName || 'no-color';
        if (!acc[colorName]) {
            acc[colorName] = [];
        }
        acc[colorName].push(symbol);
        return acc;
    }, {});
}

// Usage
const grouped = groupByColor(fillSymbols.symbols);
/*
{
  blue: [{ name: 'Badan Air', ... }, ...],
  red: [{ name: 'Badan Jalan', ... }, ...],
  ...
}
*/
```

### 3. Create Color-based Style Selector

```tsx
function ColorStylePicker({ symbols, onSelect }) {
    const colorGroups = groupByColor(symbols);

    return (
        <div>
            {Object.entries(colorGroups).map(([color, items]) => (
                <div key={color}>
                    <h4 style={{ color: items[0]?.color?.hex }}>
                        {color} ({items.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {items.map(symbol => (
                            <button
                                key={symbol.id}
                                onClick={() => onSelect(symbol)}
                                className="p-2 border rounded"
                                style={{
                                    borderColor: symbol.color?.hex,
                                    backgroundColor: `${symbol.color?.hex}20`
                                }}
                            >
                                {symbol.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### 4. Map Symbols to GeoJSON Features

```tsx
function applyStyleToGeoJSON(
    geojson: GeoJSON.FeatureCollection,
    symbolName: string,
    symbols: any[]
) {
    const symbol = symbols.find(s => s.name === symbolName);

    if (!symbol?.color) return geojson;

    return {
        ...geojson,
        features: geojson.features.map(feature => ({
            ...feature,
            properties: {
                ...feature.properties,
                fill: symbol.color.hex,
                'fill-opacity': 0.5,
                stroke: symbol.color.hex,
                'stroke-width': 2
            }
        }))
    };
}
```

---

## 🔍 Catatan Penting

### Sumber Warna

- ✅ Warna di-extract dari **tags** dalam file .style
- ✅ Dipetakan ke nilai RGB standar
- ⚠️ Bukan warna exact dari ArcGIS (karena binary data kosong)

### Mapping Warna

Script menggunakan mapping standar:
- `blue` → `#0000ff` (RGB: 0, 0, 255)
- `red` → `#ff0000` (RGB: 255, 0, 0)
- `green` → `#00ff00` (RGB: 0, 255, 0)
- dst.

Lihat [extractColorsFromTags.js](scripts/extractColorsFromTags.js) untuk mapping lengkap.

### Symbols Tanpa Warna

Beberapa symbols tidak memiliki nama warna di tags:
- Fill: 18 symbols (10%)
- Line: 5 symbols (6%)
- Marker: 0 symbols (0%)

Untuk symbols ini, Anda bisa:
1. Tambahkan warna default
2. Gunakan warna berdasarkan kategori
3. Biarkan menggunakan warna default layer

---

## 🎨 Extended Color Palette

Jika ingin menambah warna, edit `COLOR_MAP` di [scripts/extractColorsFromTags.js](scripts/extractColorsFromTags.js):

```javascript
const COLOR_MAP = {
    // Add your colors here
    'skyblue': { r: 135, g: 206, b: 235, hex: '#87ceeb' },
    'forestgreen': { r: 34, g: 139, b: 34, hex: '#228b22' },
    // ...
};
```

Then re-run:
```bash
npm run convert:colors
```

---

## 📚 File References

- [scripts/extractColorsFromTags.js](scripts/extractColorsFromTags.js) - Extraction script
- [style-output/color-summary.json](style-output/color-summary.json) - Usage statistics
- [style-output/style-color-palette.json](style-output/style-color-palette.json) - Complete palette
- [style-output/fill-symbols-with-colors.json](style-output/fill-symbols-with-colors.json) - Fill symbols
- [style-output/line-symbols-with-colors.json](style-output/line-symbols-with-colors.json) - Line symbols
- [style-output/marker-symbols-with-colors.json](style-output/marker-symbols-with-colors.json) - Marker symbols

---

**Last Updated:** 2025-11-17
