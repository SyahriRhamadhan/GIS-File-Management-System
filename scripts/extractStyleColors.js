import MDBReader from 'mdb-reader';
import fs from 'fs';
import path from 'path';

/**
 * Extract color information from ArcGIS Style symbols
 * This script attempts to parse RGB values from the binary Object data
 */

const STYLE_FILE = 'Simbolisasi (1).style';
const OUTPUT_DIR = 'style-output';

/**
 * Try to extract RGB color from binary buffer
 * ArcGIS stores colors in different formats, this attempts common patterns
 */
function extractRGBFromBuffer(buffer) {
    if (!buffer || buffer.length < 4) return null;

    // Try different offset positions where RGB might be stored
    const attempts = [];

    // Method 1: Direct RGB bytes (common in simple fills)
    // Look for RGB patterns in the buffer
    for (let i = 0; i < Math.min(buffer.length - 3, 200); i++) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];

        // Check if values are reasonable RGB (0-255)
        if (r <= 255 && g <= 255 && b <= 255) {
            // Calculate if this looks like a valid color
            // Skip all zeros or all 255s unless it's clearly intentional
            if (!(r === 0 && g === 0 && b === 0 && i > 20) &&
                !(r === 255 && g === 255 && b === 255 && i > 20)) {
                attempts.push({
                    offset: i,
                    r, g, b,
                    hex: rgbToHex(r, g, b),
                    confidence: calculateConfidence(r, g, b, i)
                });
            }
        }
    }

    // Return the most confident match
    if (attempts.length > 0) {
        attempts.sort((a, b) => b.confidence - a.confidence);
        return attempts[0];
    }

    return null;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function calculateConfidence(r, g, b, offset) {
    let confidence = 0;

    // Prefer colors that are not pure black or white
    if (!(r === 0 && g === 0 && b === 0)) confidence += 10;
    if (!(r === 255 && g === 255 && b === 255)) confidence += 10;

    // Prefer offsets that are commonly used in ArcGIS (around 20-100 bytes)
    if (offset >= 20 && offset <= 100) confidence += 20;
    if (offset >= 40 && offset <= 80) confidence += 10;

    // Prefer colors with some variety (not all same value)
    if (!(r === g && g === b)) confidence += 15;

    // Prefer certain offset positions that are common in ArcGIS
    if (offset === 44 || offset === 48 || offset === 52) confidence += 25;

    return confidence;
}

/**
 * Enhanced metadata extraction with color parsing
 */
function extractSymbolWithColor(record) {
    const metadata = {
        id: record.ID,
        name: record.Name || 'Unnamed',
        category: record.Category || null,
        tags: record.Tags || null
    };

    // Try to extract RGB from Object buffer
    if (record.Object instanceof Buffer) {
        metadata.objectSize = record.Object.length;

        const colorData = extractRGBFromBuffer(record.Object);
        if (colorData) {
            metadata.color = {
                r: colorData.r,
                g: colorData.g,
                b: colorData.b,
                hex: colorData.hex,
                offset: colorData.offset,
                confidence: colorData.confidence
            };
        }

        // Store first 200 bytes as hex for manual inspection
        metadata.objectPreview = record.Object.slice(0, 200).toString('hex');
    }

    return metadata;
}

async function extractStyleColors() {
    try {
        console.log('Reading ArcGIS Style file:', STYLE_FILE);
        console.log('Extracting color information from symbols...\n');

        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        const symbolTables = ['Fill Symbols', 'Line Symbols', 'Marker Symbols'];
        const results = {};

        for (const tableName of symbolTables) {
            console.log(`Processing: ${tableName}`);

            try {
                const table = reader.getTable(tableName);
                const data = table.getData();

                const symbols = data.map(record => extractSymbolWithColor(record));

                // Count how many have color extracted
                const withColor = symbols.filter(s => s.color).length;
                console.log(`  ✓ Extracted ${symbols.length} symbols`);
                console.log(`  ✓ Found colors in ${withColor} symbols (${Math.round(withColor/symbols.length*100)}%)`);

                results[tableName] = {
                    count: symbols.length,
                    withColor: withColor,
                    items: symbols
                };

                // Save to file
                const fileName = path.join(OUTPUT_DIR, `${tableName}-with-colors.json`);
                fs.writeFileSync(fileName, JSON.stringify({
                    table: tableName,
                    count: symbols.length,
                    withColor: withColor,
                    items: symbols
                }, null, 2));

                // Show some examples
                console.log(`  Examples with colors:`);
                symbols.filter(s => s.color).slice(0, 3).forEach(s => {
                    console.log(`    - ${s.name}: ${s.color.hex} (RGB: ${s.color.r}, ${s.color.g}, ${s.color.b})`);
                });
                console.log();

            } catch (error) {
                console.error(`  ✗ Error processing ${tableName}:`, error.message);
            }
        }

        // Create color palette file
        const colorPalette = {};
        for (const [tableName, data] of Object.entries(results)) {
            colorPalette[tableName] = data.items
                .filter(s => s.color)
                .map(s => ({
                    name: s.name,
                    category: s.category,
                    hex: s.color.hex,
                    rgb: {
                        r: s.color.r,
                        g: s.color.g,
                        b: s.color.b
                    }
                }));
        }

        const paletteFile = path.join(OUTPUT_DIR, 'color-palette.json');
        fs.writeFileSync(paletteFile, JSON.stringify(colorPalette, null, 2));

        console.log('='.repeat(50));
        console.log('✓ Color extraction complete!');
        console.log('='.repeat(50));
        console.log('\nGenerated files:');
        console.log('  - Fill Symbols-with-colors.json');
        console.log('  - Line Symbols-with-colors.json');
        console.log('  - Marker Symbols-with-colors.json');
        console.log('  - color-palette.json (cleaned palette)');

    } catch (error) {
        console.error('\n✗ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

extractStyleColors();
