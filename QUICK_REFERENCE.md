# ArcGIS Style Converter - Quick Reference

## 🚀 Commands

```bash
# Convert .style to JSON (metadata only)
npm run convert:style

# Extract colors from tags
npm run convert:colors

# Full conversion (with binary data preview)
npm run convert:style-full
```

## 📂 Output Location

```
style-output/
├── summary.json                       # Overview
├── Fill Symbols.json                  # 182 polygon symbols
├── Line Symbols.json                  # 90 line symbols
├── Marker Symbols.json                # 130 marker symbols
├── fill-symbols-with-colors.json      # Fill symbols with RGB colors
├── line-symbols-with-colors.json      # Line symbols with RGB colors
├── marker-symbols-with-colors.json    # Marker symbols with RGB colors
├── style-color-palette.json           # Complete color palette
└── color-summary.json                 # Color usage statistics
```

## 💡 Quick Usage

### 1. Load Symbols

```tsx
import { useStyleSymbols } from '@/hooks/use-style-symbols';

const { symbols, loading, categories } = useStyleSymbols('fill');
```

### 2. Search

```tsx
import { searchSymbols } from '@/utils/arcgisStyleUtils';

const results = searchSymbols(symbols, 'badan air');
```

### 3. Filter by Category

```tsx
import { getSymbolsByCategory } from '@/utils/arcgisStyleUtils';

const polaRuang = getSymbolsByCategory(symbols, 'Pola Ruang');
```

### 4. Use Picker Component

```tsx
import { StyleSymbolPicker } from '@/components/StyleSymbolPicker';

<StyleSymbolPicker
    symbols={symbols}
    symbolType="fill"
    onSymbolSelect={(symbol) => handleSelect(symbol)}
/>
```

## 📊 Available Data

### Fill Symbols (182)
- Pola Ruang
- Kawasan Strategis
- Ketentuan Tambahan
- Ketentuan Khusus

### Line Symbols (90)
- Jaringan Transportasi
- Jaringan Energi
- Jaringan Sumber Daya Air
- Jaringan Telekomunikasi
- Jaringan Prasarana Lainnya

### Marker Symbols (130)
- Jaringan Transportasi
- Jaringan Energi
- Jaringan Prasarana Lainnya
- Sistem Pusat Permukiman

## 🔧 Common Functions

```typescript
// Get all categories
getCategories(symbols)

// Group by category
groupSymbolsByCategory(symbols)

// Find by name
findSymbolByName(symbols, 'Badan Air')

// Get stats
getSymbolStats(symbols)

// Format for display
formatSymbolForDisplay(symbol)
```

## 📝 Symbol Object Structure

```json
{
  "id": 1,
  "name": "Badan Air",
  "category": "Pola Ruang",
  "tags": "rgb;simple;blue"
}
```

## 📚 Full Documentation

- [ARCGIS_STYLE_CONVERSION.md](./ARCGIS_STYLE_CONVERSION.md) - Complete docs
- [STYLE_USAGE_GUIDE.md](./STYLE_USAGE_GUIDE.md) - Usage examples
- [scripts/README.md](./scripts/README.md) - Script details
