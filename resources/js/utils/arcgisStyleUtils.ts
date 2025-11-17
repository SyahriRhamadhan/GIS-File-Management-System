/**
 * Utility functions for working with ArcGIS Style symbols
 * converted from .style file to JSON
 */

export interface StyleSymbol {
    id: number;
    name: string;
    category?: string;
    tags?: string;
    hasObjectData?: boolean;
    objectSize?: number;
}

export interface StyleTable {
    table: string;
    count: number;
    items: StyleSymbol[];
}

export interface StyleSummary {
    metadata: {
        sourceFile: string;
        extractedDate: string;
        totalTables: number;
    };
    summary: Record<
        string,
        {
            count: number;
            categories: string[];
        }
    >;
}

/**
 * Parse tags from symbol into array
 */
export function parseSymbolTags(symbol: StyleSymbol): string[] {
    if (!symbol.tags) return [];
    return symbol.tags.split(';').filter(Boolean);
}

/**
 * Get symbols by category
 */
export function getSymbolsByCategory(
    symbols: StyleSymbol[],
    category: string,
): StyleSymbol[] {
    return symbols.filter((symbol) => symbol.category === category);
}

/**
 * Find symbol by name (case-insensitive)
 */
export function findSymbolByName(
    symbols: StyleSymbol[],
    name: string,
): StyleSymbol | undefined {
    const lowerName = name.toLowerCase();
    return symbols.find((symbol) => symbol.name.toLowerCase() === lowerName);
}

/**
 * Get all unique categories from symbols
 */
export function getCategories(symbols: StyleSymbol[]): string[] {
    const categories = new Set<string>();
    symbols.forEach((symbol) => {
        if (symbol.category) {
            categories.add(symbol.category.trim());
        }
    });
    return Array.from(categories).sort();
}

/**
 * Create a lookup map for quick symbol access by name
 */
export function createSymbolMap(
    symbols: StyleSymbol[],
): Map<string, StyleSymbol> {
    const map = new Map<string, StyleSymbol>();
    symbols.forEach((symbol) => {
        map.set(symbol.name, symbol);
    });
    return map;
}

/**
 * Create a category-based grouped structure
 */
export function groupSymbolsByCategory(symbols: StyleSymbol[]): Record<
    string,
    StyleSymbol[]
> {
    const grouped: Record<string, StyleSymbol[]> = {};

    symbols.forEach((symbol) => {
        const category = symbol.category || 'Uncategorized';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(symbol);
    });

    return grouped;
}

/**
 * Search symbols by name or tags
 */
export function searchSymbols(
    symbols: StyleSymbol[],
    query: string,
): StyleSymbol[] {
    const lowerQuery = query.toLowerCase();

    return symbols.filter((symbol) => {
        // Search in name
        if (symbol.name.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        // Search in category
        if (symbol.category?.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        // Search in tags
        if (symbol.tags?.toLowerCase().includes(lowerQuery)) {
            return true;
        }

        return false;
    });
}

/**
 * Check if symbol has specific tag
 */
export function hasTag(symbol: StyleSymbol, tag: string): boolean {
    if (!symbol.tags) return false;
    const tags = parseSymbolTags(symbol);
    return tags.includes(tag);
}

/**
 * Get symbols with specific tag
 */
export function getSymbolsByTag(
    symbols: StyleSymbol[],
    tag: string,
): StyleSymbol[] {
    return symbols.filter((symbol) => hasTag(symbol, tag));
}

/**
 * Extract color information from tags (basic)
 */
export function getColorFromTags(symbol: StyleSymbol): string | null {
    const tags = parseSymbolTags(symbol);

    // Look for color keywords in tags
    const colorKeywords = [
        'red',
        'blue',
        'green',
        'yellow',
        'orange',
        'purple',
        'pink',
        'white',
        'black',
        'gray',
        'brown',
    ];

    for (const tag of tags) {
        if (colorKeywords.includes(tag.toLowerCase())) {
            return tag.toLowerCase();
        }
    }

    return null;
}

/**
 * Check if symbol is simple or multilayer
 */
export function isMultilayerSymbol(symbol: StyleSymbol): boolean {
    return hasTag(symbol, 'multilayer');
}

/**
 * Get symbol type from tags
 */
export function getSymbolType(symbol: StyleSymbol): string {
    const tags = parseSymbolTags(symbol);

    if (tags.includes('simple')) return 'simple';
    if (tags.includes('multilayer')) return 'multilayer';
    if (tags.includes('cartographic')) return 'cartographic';
    if (tags.includes('character')) return 'character';

    return 'unknown';
}

/**
 * Format symbol for display in UI
 */
export function formatSymbolForDisplay(symbol: StyleSymbol): {
    id: number;
    name: string;
    category: string;
    type: string;
    color: string | null;
    isMultilayer: boolean;
} {
    return {
        id: symbol.id,
        name: symbol.name,
        category: symbol.category || 'Uncategorized',
        type: getSymbolType(symbol),
        color: getColorFromTags(symbol),
        isMultilayer: isMultilayerSymbol(symbol),
    };
}

/**
 * Get statistics about symbol collection
 */
export function getSymbolStats(symbols: StyleSymbol[]): {
    total: number;
    categories: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    multilayer: number;
} {
    const stats = {
        total: symbols.length,
        categories: 0,
        byCategory: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        multilayer: 0,
    };

    symbols.forEach((symbol) => {
        // Count by category
        const category = symbol.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Count by type
        const type = getSymbolType(symbol);
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count multilayer
        if (isMultilayerSymbol(symbol)) {
            stats.multilayer++;
        }
    });

    stats.categories = Object.keys(stats.byCategory).length;

    return stats;
}
