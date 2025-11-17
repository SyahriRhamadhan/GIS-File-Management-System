import MDBReader from 'mdb-reader';
import fs from 'fs';

const STYLE_FILE = 'Simbolisasi (1).style';

async function inspectAllFields() {
    try {
        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        console.log('Inspecting all fields in Fill Symbols table...\n');
        const table = reader.getTable('Fill Symbols');
        const data = table.getData();

        if (data.length === 0) {
            console.log('No data found!');
            return;
        }

        // Get first record
        const firstRecord = data[0];

        console.log('Available fields in first record:');
        console.log('='.repeat(70));

        // Show all field names and types
        for (const [key, value] of Object.entries(firstRecord)) {
            const type = value instanceof Buffer ? 'Buffer' : typeof value;
            const preview = value instanceof Buffer
                ? `Buffer(${value.length} bytes): ${value.slice(0, 20).toString('hex')}...`
                : JSON.stringify(value);

            console.log(`${key.padEnd(20)} [${type.padEnd(10)}] = ${preview}`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('\nDetailed inspection of first 3 symbols:\n');

        // Show first 3 records in detail
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const record = data[i];

            console.log(`\nSymbol ${i + 1}: ${record.Name || 'Unnamed'}`);
            console.log('-'.repeat(50));

            for (const [key, value] of Object.entries(record)) {
                if (value instanceof Buffer) {
                    console.log(`  ${key}: Buffer(${value.length} bytes)`);
                    if (value.length > 0) {
                        console.log(`    First 50 bytes (hex): ${value.slice(0, 50).toString('hex')}`);
                        console.log(`    First 20 bytes (dec): ${Array.from(value.slice(0, 20)).join(', ')}`);
                    }
                } else if (value !== null && value !== undefined) {
                    console.log(`  ${key}: ${JSON.stringify(value)}`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
        console.error(error.stack);
    }
}

inspectAllFields();
