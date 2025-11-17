import MDBReader from 'mdb-reader';
import fs from 'fs';

/**
 * Inspect binary Object data to understand the structure
 */

const STYLE_FILE = 'Simbolisasi (1).style';

function hexDump(buffer, length = 100) {
    const bytes = buffer.slice(0, length);
    let hex = '';
    let ascii = '';
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
        if (i > 0 && i % 16 === 0) {
            output += `${hex}  ${ascii}\n`;
            hex = '';
            ascii = '';
        }

        const byte = bytes[i];
        hex += byte.toString(16).padStart(2, '0') + ' ';
        ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
    }

    if (hex) {
        output += `${hex.padEnd(48)}  ${ascii}\n`;
    }

    return output;
}

function analyzeColorBytes(buffer) {
    console.log('\nLooking for color patterns...\n');

    // Look for RGB patterns (values 0-255)
    for (let i = 0; i < Math.min(buffer.length - 3, 100); i++) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];
        const a = buffer[i + 3];

        // Check if could be RGB or RGBA
        if (r <= 255 && g <= 255 && b <= 255) {
            console.log(`Offset ${i}: R=${r} G=${g} B=${b} A=${a} => #${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
        }
    }
}

async function inspectBinaryData() {
    try {
        const buffer = fs.readFileSync(STYLE_FILE);
        const reader = new MDBReader(buffer);

        console.log('Inspecting Fill Symbols...\n');
        const table = reader.getTable('Fill Symbols');
        const data = table.getData();

        // Look at first 5 symbols
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const record = data[i];

            console.log('='.repeat(70));
            console.log(`Symbol ${i + 1}: ${record.Name}`);
            console.log(`Category: ${record.Category}`);
            console.log(`Tags: ${record.Tags}`);
            console.log('-'.repeat(70));

            if (record.Object instanceof Buffer) {
                console.log(`Object size: ${record.Object.length} bytes`);
                console.log('\nHex dump (first 100 bytes):');
                console.log(hexDump(record.Object, 100));

                analyzeColorBytes(record.Object);
            }

            console.log('\n');
        }

        // Also check if there's a separate Colors table with actual color values
        console.log('\n' + '='.repeat(70));
        console.log('Checking Colors table...');
        console.log('='.repeat(70));

        try {
            const colorsTable = reader.getTable('Colors');
            const colorsData = colorsTable.getData();

            console.log(`Found ${colorsData.length} color entries\n`);

            colorsData.slice(0, 5).forEach((record, i) => {
                console.log(`Color ${i + 1}:`);
                console.log(`  Name: ${record.Name}`);

                if (record.Object instanceof Buffer) {
                    console.log(`  Size: ${record.Object.length} bytes`);
                    console.log(`  Hex: ${record.Object.slice(0, 50).toString('hex')}`);

                    // Try to extract RGB
                    if (record.Object.length >= 4) {
                        console.log(`  First 4 bytes: ${record.Object[0]}, ${record.Object[1]}, ${record.Object[2]}, ${record.Object[3]}`);
                    }
                }
                console.log();
            });

        } catch (e) {
            console.log('Colors table is empty or not accessible');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectBinaryData();
