import MDBReader from 'mdb-reader';
import fs from 'fs';
import path from 'path';

/**
 * Extract ArcGIS Style symbols to a more readable JSON format
 * Focuses on extracting symbol metadata (name, category, tags)
 * without the binary object data
 */

const STYLE_FILE = 'Simbolisasi (1).style';
const OUTPUT_DIR = 'style-output';

// Symbol tables in ArcGIS Style (with actual table names from the file)
const SYMBOL_TABLES = [
    'Area Patches',
    'Backgrounds',
    'Borders',
    'Color Ramps',
    'Colors',
    'Fill Symbols',
    'Hatches',
    'Labels',
    'Legend Items',
    'Line Patches',
    'Line Symbols',
    'Maplex Labels',
    'Marker Symbols',
    'North Arrows',
    'Representation Markers',
    'Representation Rules',
    'Scale Bars',
    'Scale Texts',
    'Shadows',
    'Text Symbols',
    'Vectorization Settings',
    'Classes',
    'Reference Systems'
];

function extractSymbolMetadata(record) {
    const metadata = {};

    // Common fields in symbol tables
    if (record.ID !== undefined) metadata.id = record.ID;
    if (record.Name) metadata.name = record.Name;
    if (record.Category) metadata.category = record.Category;
    if (record.Tags) metadata.tags = record.Tags;

    // Handle Object field (binary serialized data)
    if (record.Object instanceof Buffer) {
        metadata.hasObjectData = true;
        metadata.objectSize = record.Object.length;
    }

    // Color specific fields
    if (record.Color !== undefined) {
        metadata.color = record.Color;
    }

    // Copy other non-binary fields
    for (const [key, value] of Object.entries(record)) {
        if (!(value instanceof Buffer) &&
            !['ID', 'Name', 'Category', 'Tags', 'Object', 'Color'].includes(key)) {
            metadata[key] = value;
        }
    }

    return metadata;
}

function extractColors(data) {
    // Special handling for Colors table
    return data.map(record => {
        const color = {
            id: record.ID,
            name: record.Name || 'Unnamed'
        };

        // Try to extract RGB values if available
        if (record.Object instanceof Buffer && record.Object.length >= 4) {
            const buffer = record.Object;
            // Simple RGB extraction (may vary based on ArcGIS format)
            color.rgb = {
                r: buffer[0],
                g: buffer[1],
                b: buffer[2]
            };
        }

        return color;
    });
}

async function extractStyleSymbols() {
    try {
        console.log('Reading ArcGIS Style file:', STYLE_FILE);

        // Create output directory
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Read the .style file
        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        const tables = reader.getTableNames();
        console.log('Available tables:', tables.join(', '));

        const extractedData = {
            metadata: {
                sourceFile: STYLE_FILE,
                extractedDate: new Date().toISOString(),
                totalTables: tables.length
            },
            symbols: {}
        };

        // Extract symbol tables
        for (const tableName of SYMBOL_TABLES) {
            if (!tables.includes(tableName)) {
                console.log(`⚠ Table "${tableName}" not found, skipping...`);
                continue;
            }

            try {
                console.log(`\nProcessing: ${tableName}`);
                const table = reader.getTable(tableName);
                const data = table.getData();

                let processedData;
                if (tableName === 'Colors') {
                    processedData = extractColors(data);
                } else {
                    processedData = data.map(record => extractSymbolMetadata(record));
                }

                extractedData.symbols[tableName] = {
                    count: processedData.length,
                    items: processedData
                };

                console.log(`  ✓ Extracted ${processedData.length} items`);

                // Save individual table to separate file
                const tableFile = path.join(OUTPUT_DIR, `${tableName}.json`);
                fs.writeFileSync(tableFile, JSON.stringify({
                    table: tableName,
                    count: processedData.length,
                    items: processedData
                }, null, 2));

            } catch (error) {
                console.error(`  ✗ Error processing ${tableName}:`, error.message);
            }
        }

        // Save complete extraction
        const mainOutputFile = path.join(OUTPUT_DIR, 'complete-style.json');
        fs.writeFileSync(mainOutputFile, JSON.stringify(extractedData, null, 2));

        // Create summary file
        const summary = {
            metadata: extractedData.metadata,
            summary: {}
        };

        for (const [tableName, data] of Object.entries(extractedData.symbols)) {
            summary.summary[tableName] = {
                count: data.count,
                categories: [...new Set(data.items
                    .map(item => item.category)
                    .filter(Boolean))]
            };
        }

        const summaryFile = path.join(OUTPUT_DIR, 'summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log('✓ Extraction complete!');
        console.log('='.repeat(50));
        console.log(`\nOutput directory: ${OUTPUT_DIR}/`);
        console.log('\nGenerated files:');
        console.log('  - complete-style.json (all symbols combined)');
        console.log('  - summary.json (overview)');
        console.log('  - [TableName].json (individual symbol tables)');

        console.log('\n=== Summary ===');
        for (const [tableName, info] of Object.entries(summary.summary)) {
            console.log(`${tableName}: ${info.count} items`);
            if (info.categories.length > 0) {
                console.log(`  Categories: ${info.categories.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('\n✗ Error extracting style symbols:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the extraction
extractStyleSymbols();
