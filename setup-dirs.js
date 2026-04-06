// Setup script to create utils directory
const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
  console.log('Created utils directory');
}
