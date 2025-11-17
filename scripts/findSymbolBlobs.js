import MDBReader from 'mdb-reader';
import fs from 'fs';

const STYLE_FILE = 'Simbolisasi (1).style';

async function findSymbolBlobs() {
    try {
        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        const allTables = reader.getTableNames();

        console.log('Searching for tables with BLOB/binary data...\n');
        console.log('Available tables:', allTables.join(', '));
        console.log('\n' + '='.repeat(70) + '\n');

        for (const tableName of allTables) {
            try {
                const table = reader.getTable(tableName);
                const data = table.getData();

                if (data.length === 0) continue;

                const firstRecord = data[0];
                const hasBlobData = Object.values(firstRecord).some(v => v instanceof Buffer && v.length > 100);

                if (hasBlobData) {
                    console.log(`\n📦 ${tableName} (${data.length} records) - HAS BLOB DATA`);
                    console.log('-'.repeat(70));

                    // Show fields
                    for (const [key, value] of Object.entries(firstRecord)) {
                        const type = value instanceof Buffer ? `Buffer(${value.length})` : typeof value;
                        console.log(`  ${key.padEnd(20)} : ${type}`);
                    }

                    // Show first record details
                    console.log('\n  First record details:');
                    for (const [key, value] of Object.entries(firstRecord)) {
                        if (value instanceof Buffer && value.length > 0) {
                            console.log(`    ${key}:`);
                            console.log(`      Size: ${value.length} bytes`);
                            console.log(`      First 60 bytes (hex): ${value.slice(0, 60).toString('hex')}`);
                            console.log(`      First 20 bytes (dec): [${Array.from(value.slice(0, 20)).join(', ')}]`);

                            // Try to find RGB patterns
                            for (let i = 0; i < Math.min(value.length - 3, 100); i++) {
                                const r = value[i];
                                const g = value[i + 1];
                                const b = value[i + 2];

                                // Look for reasonable RGB values
                                if (r <= 255 && g <= 255 && b <= 255 &&
                                    !(r === 0 && g === 0 && b === 0 && i > 10) &&
                                    !(r === 255 && g === 255 && b === 255 && i > 10)) {
                                    console.log(`      Possible RGB at offset ${i}: (${r}, ${g}, ${b}) = #${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
                                    if (i > 80) break; // Don't show too many
                                }
                            }
                        } else if (value !== null && value !== undefined && !(value instanceof Buffer)) {
                            console.log(`    ${key}: ${JSON.stringify(value)}`);
                        }
                    }
                }

            } catch (error) {
                // Skip tables that can't be read
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('\nDone searching for BLOB data.');

    } catch (error) {
        console.error('Error:', error);
        console.error(error.stack);
    }
}

findSymbolBlobs();
