const fs = require('fs');
const path = './dist/index.html';

if (!fs.existsSync(path)) {
  console.error('❌ Build failed: dist/index.html not found');
  process.exit(1);
}
console.log('✅ Build verified');