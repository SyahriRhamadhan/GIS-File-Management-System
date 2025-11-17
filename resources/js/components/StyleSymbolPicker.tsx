import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    type StyleSymbol,
    searchSymbols,
    getCategories,
    groupSymbolsByCategory,
    formatSymbolForDisplay,
} from '@/utils/arcgisStyleUtils';

interface StyleSymbolPickerProps {
    symbols: StyleSymbol[];
    symbolType: 'fill' | 'line' | 'marker';
    onSymbolSelect: (symbol: StyleSymbol) => void;
    selectedSymbolId?: number;
}

/**
 * Component for picking ArcGIS style symbols
 * Provides search, category filtering, and symbol preview
 */
export function StyleSymbolPicker({
    symbols,
    symbolType,
    onSymbolSelect,
    selectedSymbolId,
}: StyleSymbolPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get available categories
    const categories = useMemo(() => getCategories(symbols), [symbols]);

    // Filter symbols based on search and category
    const filteredSymbols = useMemo(() => {
        let filtered = symbols;

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = searchSymbols(filtered, searchQuery);
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(
                (symbol) => symbol.category === selectedCategory,
            );
        }

        return filtered;
    }, [symbols, searchQuery, selectedCategory]);

    // Group symbols by category for organized display
    const groupedSymbols = useMemo(
        () => groupSymbolsByCategory(filteredSymbols),
        [filteredSymbols],
    );

    const getSymbolTypeLabel = () => {
        switch (symbolType) {
            case 'fill':
                return 'Fill Symbol';
            case 'line':
                return 'Line Symbol';
            case 'marker':
                return 'Marker Symbol';
            default:
                return 'Symbol';
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Select {getSymbolTypeLabel()}</Label>

                {/* Search Input */}
                <Input
                    type="text"
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
                <Label>Category</Label>
                <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Symbol List */}
            <div className="space-y-4">
                <div className="text-sm text-gray-500">
                    Showing {filteredSymbols.length} of {symbols.length}{' '}
                    symbols
                </div>

                <div className="max-h-96 space-y-4 overflow-y-auto rounded-md border p-4">
                    {Object.entries(groupedSymbols).map(
                        ([category, categorySymbols]) => (
                            <div key={category}>
                                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                    {category}
                                </h3>
                                <div className="space-y-1">
                                    {categorySymbols.map((symbol) => {
                                        const formatted =
                                            formatSymbolForDisplay(symbol);
                                        const isSelected =
                                            symbol.id === selectedSymbolId;

                                        return (
                                            <button
                                                key={symbol.id}
                                                onClick={() =>
                                                    onSymbolSelect(symbol)
                                                }
                                                className={`w-full rounded-md border p-3 text-left transition-colors ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {symbol.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>
                                                                {formatted.type}
                                                            </span>
                                                            {formatted.color && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span
                                                                        className={`inline-block h-3 w-3 rounded-full border`}
                                                                        style={{
                                                                            backgroundColor:
                                                                                formatted.color,
                                                                        }}
                                                                        title={
                                                                            formatted.color
                                                                        }
                                                                    />
                                                                </>
                                                            )}
                                                            {formatted.isMultilayer && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                                                                        Multi-layer
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="ml-2 text-blue-500">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ),
                    )}

                    {filteredSymbols.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            No symbols found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StyleSymbolPicker;
