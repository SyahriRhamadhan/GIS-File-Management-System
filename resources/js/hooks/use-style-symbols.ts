import { useState, useEffect, useMemo } from 'react';
import type { StyleSymbol, StyleTable } from '@/utils/arcgisStyleUtils';
import {
    getCategories,
    getSymbolStats,
    createSymbolMap,
} from '@/utils/arcgisStyleUtils';

/**
 * Hook for loading and managing ArcGIS style symbols
 *
 * @example
 * ```tsx
 * const { symbols, loading, error, stats } = useStyleSymbols('fill');
 * ```
 */
export function useStyleSymbols(symbolType: 'fill' | 'line' | 'marker') {
    const [symbols, setSymbols] = useState<StyleSymbol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the appropriate file name based on symbol type
    const getFileName = () => {
        switch (symbolType) {
            case 'fill':
                return '/style-output/Fill Symbols.json';
            case 'line':
                return '/style-output/Line Symbols.json';
            case 'marker':
                return '/style-output/Marker Symbols.json';
            default:
                return null;
        }
    };

    // Load symbols from JSON file
    useEffect(() => {
        const loadSymbols = async () => {
            try {
                setLoading(true);
                setError(null);

                const fileName = getFileName();
                if (!fileName) {
                    throw new Error(`Invalid symbol type: ${symbolType}`);
                }

                // Fetch the JSON file
                const response = await fetch(fileName);
                if (!response.ok) {
                    throw new Error(`Failed to load symbols: ${response.statusText}`);
                }

                const data: StyleTable = await response.json();
                setSymbols(data.items || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Error loading style symbols:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSymbols();
    }, [symbolType]);

    // Memoized computed values
    const categories = useMemo(() => getCategories(symbols), [symbols]);
    const stats = useMemo(() => getSymbolStats(symbols), [symbols]);
    const symbolMap = useMemo(() => createSymbolMap(symbols), [symbols]);

    // Helper function to get symbol by name
    const getSymbolByName = (name: string) => symbolMap.get(name);

    // Helper function to get symbol by id
    const getSymbolById = (id: number) =>
        symbols.find((symbol) => symbol.id === id);

    return {
        symbols,
        loading,
        error,
        categories,
        stats,
        getSymbolByName,
        getSymbolById,
    };
}

/**
 * Hook for loading all symbol types at once
 *
 * @example
 * ```tsx
 * const { fillSymbols, lineSymbols, markerSymbols, allLoaded } = useAllStyleSymbols();
 * ```
 */
export function useAllStyleSymbols() {
    const fillData = useStyleSymbols('fill');
    const lineData = useStyleSymbols('line');
    const markerData = useStyleSymbols('marker');

    const allLoaded =
        !fillData.loading && !lineData.loading && !markerData.loading;
    const hasError =
        fillData.error !== null ||
        lineData.error !== null ||
        markerData.error !== null;

    return {
        fillSymbols: fillData,
        lineSymbols: lineData,
        markerSymbols: markerData,
        allLoaded,
        hasError,
        errors: {
            fill: fillData.error,
            line: lineData.error,
            marker: markerData.error,
        },
    };
}

/**
 * Hook for managing selected symbol state
 *
 * @example
 * ```tsx
 * const { selectedSymbol, selectSymbol, clearSelection } = useSymbolSelection<StyleSymbol>();
 * ```
 */
export function useSymbolSelection<T = StyleSymbol>() {
    const [selectedSymbol, setSelectedSymbol] = useState<T | null>(null);

    const selectSymbol = (symbol: T | null) => {
        setSelectedSymbol(symbol);
    };

    const clearSelection = () => {
        setSelectedSymbol(null);
    };

    const isSelected = (symbol: T) => {
        if (!selectedSymbol) return false;
        // Assuming symbols have an id property
        return (
            (symbol as any).id === (selectedSymbol as any).id
        );
    };

    return {
        selectedSymbol,
        selectSymbol,
        clearSelection,
        isSelected,
    };
}
