import MDBReader from 'mdb-reader';
import fs from 'fs';
import path from 'path';

/**
 * Convert ArcGIS Style (.style) file to JSON
 * The .style file is a Microsoft Access Database format
 */

const STYLE_FILE = 'Simbolisasi (1).style';
const OUTPUT_FILE = 'arcgis-style.json';

async function convertStyleToJson() {
    try {
        console.log('Reading ArcGIS Style file:', STYLE_FILE);

        // Read the .style file (Microsoft Access Database)
        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        // Get all table names
        const tables = reader.getTableNames();
        console.log('Found tables:', tables);

        // Extract data from all tables
        const styleData = {};

        for (const tableName of tables) {
            try {
                // Skip system tables
                if (tableName.startsWith('MSys')) {
                    continue;
                }

                console.log(`Reading table: ${tableName}`);
                const table = reader.getTable(tableName);
                const data = table.getData();

                // Convert data to array of objects
                const records = [];
                for (const record of data) {
                    const obj = {};
                    for (const [key, value] of Object.entries(record)) {
                        // Handle binary data (Object column contains serialized symbols)
                        if (value instanceof Buffer) {
                            obj[key] = {
                                type: 'binary',
                                size: value.length,
                                // Store first 100 bytes as hex for inspection
                                preview: value.slice(0, 100).toString('hex')
                            };
                        } else {
                            obj[key] = value;
                        }
                    }
                    records.push(obj);
                }

                styleData[tableName] = {
                    count: records.length,
                    records: records
                };

                console.log(`  - Found ${records.length} records`);
            } catch (error) {
                console.error(`Error reading table ${tableName}:`, error.message);
            }
        }

        // Write to JSON file
        const outputPath = path.join(process.cwd(), OUTPUT_FILE);
        fs.writeFileSync(outputPath, JSON.stringify(styleData, null, 2));

        console.log('\n✓ Conversion complete!');
        console.log(`Output file: ${outputPath}`);

        // Print summary
        console.log('\n=== Summary ===');
        for (const [tableName, data] of Object.entries(styleData)) {
            console.log(`${tableName}: ${data.count} records`);
        }

    } catch (error) {
        console.error('Error converting style file:', error);
        process.exit(1);
    }
}

// Run the conversion
convertStyleToJson();
