import MDBReader from 'mdb-reader';
import fs from 'fs';
import path from 'path';

/**
 * Extract color information from tags
 * Since binary data is not available, we parse color names from tags
 * and map them to standard RGB values
 */

const STYLE_FILE = 'Simbolisasi (1).style';
const OUTPUT_DIR = 'style-output';

// Standard color mapping based on common GIS/ArcGIS color names
const COLOR_MAP = {
    // Basic colors
    'red': { r: 255, g: 0, b: 0, hex: '#ff0000' },
    'green': { r: 0, g: 255, b: 0, hex: '#00ff00' },
    'blue': { r: 0, g: 0, b: 255, hex: '#0000ff' },
    'yellow': { r: 255, g: 255, b: 0, hex: '#ffff00' },
    'orange': { r: 255, g: 165, b: 0, hex: '#ffa500' },
    'purple': { r: 128, g: 0, b: 128, hex: '#800080' },
    'pink': { r: 255, g: 192, b: 203, hex: '#ffc0cb' },
    'brown': { r: 165, g: 42, b: 42, hex: '#a52a2a' },
    'gray': { r: 128, g: 128, b: 128, hex: '#808080' },
    'grey': { r: 128, g: 128, b: 128, hex: '#808080' },
    'black': { r: 0, g: 0, b: 0, hex: '#000000' },
    'white': { r: 255, g: 255, b: 255, hex: '#ffffff' },

    // Extended colors (common in GIS)
    'cyan': { r: 0, g: 255, b: 255, hex: '#00ffff' },
    'magenta': { r: 255, g: 0, b: 255, hex: '#ff00ff' },
    'lime': { r: 0, g: 255, b: 0, hex: '#00ff00' },
    'navy': { r: 0, g: 0, b: 128, hex: '#000080' },
    'teal': { r: 0, g: 128, b: 128, hex: '#008080' },
    'olive': { r: 128, g: 128, b: 0, hex: '#808000' },
    'maroon': { r: 128, g: 0, b: 0, hex: '#800000' },
    'aqua': { r: 0, g: 255, b: 255, hex: '#00ffff' },

    // Light variants
    'lightblue': { r: 173, g: 216, b: 230, hex: '#add8e6' },
    'lightgreen': { r: 144, g: 238, b: 144, hex: '#90ee90' },
    'lightgray': { r: 211, g: 211, b: 211, hex: '#d3d3d3' },
    'lightgrey': { r: 211, g: 211, b: 211, hex: '#d3d3d3' },

    // Dark variants
    'darkblue': { r: 0, g: 0, b: 139, hex: '#00008b' },
    'darkgreen': { r: 0, g: 100, b: 0, hex: '#006400' },
    'darkgray': { r: 169, g: 169, b: 169, hex: '#a9a9a9' },
    'darkgrey': { r: 169, g: 169, b: 169, hex: '#a9a9a9' },
    'darkorange': { r: 255, g: 140, b: 0, hex: '#ff8c00' },
    'darkred': { r: 139, g: 0, b: 0, hex: '#8b0000' },
};

function parseColorFromTags(tags) {
    if (!tags) return null;

    const tagArray = tags.toLowerCase().split(';').map(t => t.trim());

    // Look for color names in tags
    for (const tag of tagArray) {
        if (COLOR_MAP[tag]) {
            return {
                ...COLOR_MAP[tag],
                source: 'tag',
                tagName: tag
            };
        }
    }

    // Check for compound tags like 'lightblue', 'darkred', etc.
    const compoundColors = ['light', 'dark'];
    const baseColors = ['blue', 'red', 'green', 'gray', 'grey', 'orange'];

    for (const tag of tagArray) {
        for (const prefix of compoundColors) {
            for (const base of baseColors) {
                const compound = prefix + base;
                if (tag.includes(compound) && COLOR_MAP[compound]) {
                    return {
                        ...COLOR_MAP[compound],
                        source: 'tag',
                        tagName: compound
                    };
                }
            }
        }
    }

    return null;
}

function extractSymbolWithTagColors(record) {
    const symbol = {
        id: record.ID,
        name: record.Name || 'Unnamed',
        category: record.Category || null,
        tags: record.Tags || null
    };

    // Parse color from tags
    const color = parseColorFromTags(record.Tags);
    if (color) {
        symbol.color = color;
    }

    return symbol;
}

async function extractColorsFromTags() {
    try {
        console.log('Extracting colors from tags in ArcGIS Style file\n');

        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        const symbolTables = {
            'Fill Symbols': 'fill',
            'Line Symbols': 'line',
            'Marker Symbols': 'marker'
        };

        const allResults = {};

        for (const [tableName, type] of Object.entries(symbolTables)) {
            console.log(`Processing: ${tableName}`);

            const table = reader.getTable(tableName);
            const data = table.getData();

            const symbols = data.map(record => extractSymbolWithTagColors(record));

            const withColor = symbols.filter(s => s.color).length;
            const percentage = Math.round((withColor / symbols.length) * 100);

            console.log(`  ✓ Total symbols: ${symbols.length}`);
            console.log(`  ✓ With colors: ${withColor} (${percentage}%)`);

            if (withColor > 0) {
                console.log(`  Examples:`);
                symbols.filter(s => s.color).slice(0, 5).forEach(s => {
                    console.log(`    - ${s.name}: ${s.color.hex} (${s.color.tagName})`);
                });
            }

            console.log();

            allResults[type] = {
                table: tableName,
                count: symbols.length,
                withColor: withColor,
                percentage: percentage,
                symbols: symbols
            };

            // Save individual file
            const fileName = path.join(OUTPUT_DIR, `${type}-symbols-with-colors.json`);
            fs.writeFileSync(fileName, JSON.stringify({
                table: tableName,
                count: symbols.length,
                withColor: withColor,
                symbols: symbols
            }, null, 2));
        }

        // Create color palette
        const colorPalette = {
            metadata: {
                source: 'ArcGIS Style Tags',
                note: 'Colors extracted from tag names, mapped to standard RGB values',
                colorCount: Object.keys(COLOR_MAP).length
            },
            byType: {}
        };

        for (const [type, data] of Object.entries(allResults)) {
            colorPalette.byType[type] = data.symbols
                .filter(s => s.color)
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.category,
                    color: {
                        hex: s.color.hex,
                        rgb: {
                            r: s.color.r,
                            g: s.color.g,
                            b: s.color.b
                        },
                        name: s.color.tagName
                    }
                }));
        }

        const paletteFile = path.join(OUTPUT_DIR, 'style-color-palette.json');
        fs.writeFileSync(paletteFile, JSON.stringify(colorPalette, null, 2));

        // Create color summary by color name
        const colorSummary = {};
        for (const [type, data] of Object.entries(allResults)) {
            data.symbols.filter(s => s.color).forEach(s => {
                const colorName = s.color.tagName;
                if (!colorSummary[colorName]) {
                    colorSummary[colorName] = {
                        hex: s.color.hex,
                        rgb: { r: s.color.r, g: s.color.g, b: s.color.b },
                        usedIn: { fill: 0, line: 0, marker: 0 },
                        examples: []
                    };
                }
                colorSummary[colorName].usedIn[type]++;
                if (colorSummary[colorName].examples.length < 3) {
                    colorSummary[colorName].examples.push({
                        name: s.name,
                        type: type,
                        category: s.category
                    });
                }
            });
        }

        const summaryFile = path.join(OUTPUT_DIR, 'color-summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify({
            totalColors: Object.keys(colorSummary).length,
            colors: colorSummary
        }, null, 2));

        console.log('='.repeat(70));
        console.log('✓ Color extraction complete!');
        console.log('='.repeat(70));
        console.log('\nGenerated files:');
        console.log('  - fill-symbols-with-colors.json');
        console.log('  - line-symbols-with-colors.json');
        console.log('  - marker-symbols-with-colors.json');
        console.log('  - style-color-palette.json (complete palette)');
        console.log('  - color-summary.json (colors usage summary)');

        console.log('\n📊 Color Usage Summary:');
        console.log('-'.repeat(70));
        const sortedColors = Object.entries(colorSummary)
            .sort((a, b) => {
                const totalA = a[1].usedIn.fill + a[1].usedIn.line + a[1].usedIn.marker;
                const totalB = b[1].usedIn.fill + b[1].usedIn.line + b[1].usedIn.marker;
                return totalB - totalA;
            });

        sortedColors.forEach(([name, data]) => {
            const total = data.usedIn.fill + data.usedIn.line + data.usedIn.marker;
            console.log(`${name.padEnd(15)} ${data.hex}  Used ${total}x  (Fill:${data.usedIn.fill} Line:${data.usedIn.line} Marker:${data.usedIn.marker})`);
        });

    } catch (error) {
        console.error('Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

extractColorsFromTags();
