# ArcGIS Style Symbols - Usage Guide

Guide untuk menggunakan simbol ArcGIS Style yang sudah dikonversi ke JSON dalam aplikasi React/TypeScript.

## Table of Contents

1. [Setup](#setup)
2. [Loading Symbols](#loading-symbols)
3. [Using Utility Functions](#using-utility-functions)
4. [React Components](#react-components)
5. [Integration Examples](#integration-examples)

---

## Setup

### 1. Copy Style Output

Pastikan folder `style-output/` yang berisi JSON hasil konversi tersedia di folder `public/`:

```bash
# Copy output ke public folder
cp -r style-output public/
```

Atau letakkan di `resources/js/data/` untuk import langsung:

```bash
mkdir -p resources/js/data/style-symbols
cp style-output/*.json resources/js/data/style-symbols/
```

### 2. File Structure

```
resources/js/
├── hooks/
│   └── use-style-symbols.ts       # Custom hooks
├── utils/
│   └── arcgisStyleUtils.ts        # Utility functions
├── components/
│   └── StyleSymbolPicker.tsx      # Symbol picker component
└── data/
    └── style-symbols/             # JSON files (optional)
        ├── Fill Symbols.json
        ├── Line Symbols.json
        └── Marker Symbols.json
```

---

## Loading Symbols

### Method 1: Using Custom Hook (Recommended)

```tsx
import { useStyleSymbols } from '@/hooks/use-style-symbols';

function MyComponent() {
    const { symbols, loading, error, categories, stats } = useStyleSymbols('fill');

    if (loading) return <div>Loading symbols...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Fill Symbols: {stats.total}</h2>
            <ul>
                {symbols.map(symbol => (
                    <li key={symbol.id}>{symbol.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

### Method 2: Direct Import (Static)

```tsx
import fillSymbols from '@/data/style-symbols/Fill Symbols.json';
import lineSymbols from '@/data/style-symbols/Line Symbols.json';
import markerSymbols from '@/data/style-symbols/Marker Symbols.json';

function MyComponent() {
    return (
        <div>
            <h2>Total Fill Symbols: {fillSymbols.count}</h2>
            {fillSymbols.items.map(symbol => (
                <div key={symbol.id}>{symbol.name}</div>
            ))}
        </div>
    );
}
```

### Method 3: Load All Symbol Types

```tsx
import { useAllStyleSymbols } from '@/hooks/use-style-symbols';

function SymbolManager() {
    const { fillSymbols, lineSymbols, markerSymbols, allLoaded } = useAllStyleSymbols();

    if (!allLoaded) return <div>Loading...</div>;

    return (
        <div>
            <h3>Fill: {fillSymbols.symbols.length}</h3>
            <h3>Line: {lineSymbols.symbols.length}</h3>
            <h3>Marker: {markerSymbols.symbols.length}</h3>
        </div>
    );
}
```

---

## Using Utility Functions

### Search Symbols

```tsx
import { searchSymbols } from '@/utils/arcgisStyleUtils';

const results = searchSymbols(symbols, 'badan air');
// Returns symbols matching "badan air" in name, category, or tags
```

### Filter by Category

```tsx
import { getSymbolsByCategory, getCategories } from '@/utils/arcgisStyleUtils';

// Get all categories
const categories = getCategories(symbols);
// ['Pola Ruang', 'Kawasan Strategis', ...]

// Get symbols in specific category
const polaRuangSymbols = getSymbolsByCategory(symbols, 'Pola Ruang');
```

### Group by Category

```tsx
import { groupSymbolsByCategory } from '@/utils/arcgisStyleUtils';

const grouped = groupSymbolsByCategory(symbols);
// {
//   'Pola Ruang': [...symbols],
//   'Kawasan Strategis': [...symbols],
// }

// Display grouped
Object.entries(grouped).map(([category, symbols]) => (
    <div key={category}>
        <h3>{category}</h3>
        <ul>
            {symbols.map(s => <li key={s.id}>{s.name}</li>)}
        </ul>
    </div>
));
```

### Get Symbol Information

```tsx
import { formatSymbolForDisplay, getSymbolType, getColorFromTags } from '@/utils/arcgisStyleUtils';

const symbol = symbols[0];

// Get formatted info
const info = formatSymbolForDisplay(symbol);
// {
//   id: 1,
//   name: 'Badan Air',
//   category: 'Pola Ruang',
//   type: 'simple',
//   color: 'blue',
//   isMultilayer: false
// }

// Individual helpers
const type = getSymbolType(symbol);      // 'simple' | 'multilayer' | 'cartographic'
const color = getColorFromTags(symbol);  // 'blue' | 'red' | null
```

### Statistics

```tsx
import { getSymbolStats } from '@/utils/arcgisStyleUtils';

const stats = getSymbolStats(symbols);
// {
//   total: 182,
//   categories: 4,
//   byCategory: {
//     'Pola Ruang': 150,
//     'Kawasan Strategis': 32
//   },
//   byType: {
//     'simple': 100,
//     'multilayer': 82
//   },
//   multilayer: 82
// }
```

---

## React Components

### Using StyleSymbolPicker

```tsx
import { StyleSymbolPicker } from '@/components/StyleSymbolPicker';
import { useStyleSymbols } from '@/hooks/use-style-symbols';

function MapStyleEditor() {
    const { symbols, loading } = useStyleSymbols('fill');
    const [selectedSymbol, setSelectedSymbol] = useState(null);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <StyleSymbolPicker
                symbols={symbols}
                symbolType="fill"
                onSymbolSelect={setSelectedSymbol}
                selectedSymbolId={selectedSymbol?.id}
            />

            {selectedSymbol && (
                <div className="mt-4">
                    <h3>Selected: {selectedSymbol.name}</h3>
                    <p>Category: {selectedSymbol.category}</p>
                </div>
            )}
        </div>
    );
}
```

### Custom Symbol List

```tsx
import { useStyleSymbols } from '@/hooks/use-style-symbols';
import { groupSymbolsByCategory } from '@/utils/arcgisStyleUtils';

function SymbolLibrary() {
    const { symbols, loading, categories } = useStyleSymbols('marker');
    const grouped = groupSymbolsByCategory(symbols);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            <h2>Marker Symbols Library</h2>

            {Object.entries(grouped).map(([category, categorySymbols]) => (
                <div key={category} className="border rounded-lg p-4">
                    <h3 className="font-bold mb-2">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {categorySymbols.map(symbol => (
                            <div key={symbol.id} className="p-2 border rounded hover:bg-gray-50">
                                {symbol.name}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

---

## Integration Examples

### Example 1: Layer Styling in Leaflet

```tsx
import L from 'leaflet';
import { useStyleSymbols, useSymbolSelection } from '@/hooks/use-style-symbols';

function MapWithStylePicker() {
    const { symbols } = useStyleSymbols('fill');
    const { selectedSymbol, selectSymbol } = useSymbolSelection();

    const applyStyleToLayer = (layer: L.Layer, symbol: StyleSymbol) => {
        if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
            // Extract color from tags (basic example)
            const color = getColorFromTags(symbol) || '#3388ff';

            layer.setStyle({
                color: color,
                fillColor: color,
                fillOpacity: 0.5
            });
        }
    };

    return (
        <div className="flex">
            <div className="w-64">
                <StyleSymbolPicker
                    symbols={symbols}
                    symbolType="fill"
                    onSymbolSelect={(symbol) => {
                        selectSymbol(symbol);
                        // Apply to all layers or selected layer
                        currentLayer && applyStyleToLayer(currentLayer, symbol);
                    }}
                />
            </div>
            <div className="flex-1">
                {/* Map component */}
            </div>
        </div>
    );
}
```

### Example 2: Symbol Selector for GeoJSON Properties

```tsx
function GeoJSONEditor() {
    const { symbols } = useStyleSymbols('fill');
    const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);

    const assignSymbolToFeature = (featureId: string, symbol: StyleSymbol) => {
        setFeatures(prev => prev.map(feature => {
            if (feature.id === featureId) {
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        symbolName: symbol.name,
                        symbolId: symbol.id,
                        symbolCategory: symbol.category
                    }
                };
            }
            return feature;
        }));
    };

    return (
        <div>
            {features.map(feature => {
                const symbolName = feature.properties?.symbolName;

                return (
                    <div key={feature.id}>
                        <h4>{feature.properties?.name}</h4>
                        <select
                            value={symbolName || ''}
                            onChange={(e) => {
                                const symbol = symbols.find(s => s.name === e.target.value);
                                symbol && assignSymbolToFeature(feature.id, symbol);
                            }}
                        >
                            <option value="">Select Symbol</option>
                            {symbols.map(symbol => (
                                <option key={symbol.id} value={symbol.name}>
                                    {symbol.name}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            })}
        </div>
    );
}
```

### Example 3: Category-based Filtering UI

```tsx
import { useState } from 'react';
import { useStyleSymbols } from '@/hooks/use-style-symbols';
import { getSymbolsByCategory } from '@/utils/arcgisStyleUtils';

function CategoryFilter() {
    const { symbols, categories, loading } = useStyleSymbols('line');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const displayedSymbols = selectedCategory === 'all'
        ? symbols
        : getSymbolsByCategory(symbols, selectedCategory);

    return (
        <div>
            <div className="mb-4">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                {displayedSymbols.map(symbol => (
                    <div key={symbol.id} className="p-3 border rounded">
                        <div className="font-medium">{symbol.name}</div>
                        <div className="text-sm text-gray-500">{symbol.category}</div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                Showing {displayedSymbols.length} of {symbols.length} symbols
            </div>
        </div>
    );
}
```

---

## Best Practices

1. **Use Memoization**: When filtering/searching symbols, use `useMemo` to avoid unnecessary re-renders

```tsx
const filtered = useMemo(() =>
    searchSymbols(symbols, query),
    [symbols, query]
);
```

2. **Lazy Loading**: Load symbols only when needed

```tsx
const [showPicker, setShowPicker] = useState(false);

// Only load when picker is shown
{showPicker && <StyleSymbolPicker ... />}
```

3. **Error Handling**: Always handle loading and error states

```tsx
if (loading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
```

4. **Type Safety**: Use TypeScript interfaces for type safety

```tsx
import type { StyleSymbol } from '@/utils/arcgisStyleUtils';

const handleSelect = (symbol: StyleSymbol) => {
    // TypeScript will check types
};
```

---

## API Reference

See the inline documentation in:
- `resources/js/utils/arcgisStyleUtils.ts`
- `resources/js/hooks/use-style-symbols.ts`
- `resources/js/components/StyleSymbolPicker.tsx`

---

## Notes

- Symbol color information is basic (extracted from tags). For exact RGB values, you'll need to parse the binary Object data
- This implementation focuses on symbol metadata (name, category, tags)
- For full symbol rendering, you may need additional processing of the binary data
