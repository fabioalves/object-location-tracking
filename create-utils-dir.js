const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'utils');

try {
    // Create the utils directory
    if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
        console.log('✓ utils directory successfully created');
    } else {
        console.log('✓ utils directory already exists');
    }
    
    // Verify the directory exists
    const stat = fs.statSync(utilsDir);
    console.log(`✓ Directory verified: ${stat.isDirectory() ? 'Yes' : 'No'}`);
    console.log(`✓ Full path: ${utilsDir}`);
    
    // List contents
    console.log('\n✓ Directory contents:');
    const contents = fs.readdirSync(utilsDir);
    if (contents.length === 0) {
        console.log('  (empty directory)');
    } else {
        contents.forEach(item => {
            console.log(`  - ${item}`);
        });
    }
    
    console.log('\n✓ utils directory structure created successfully!');
} catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
}
