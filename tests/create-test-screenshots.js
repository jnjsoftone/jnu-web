// Script to create test screenshot files
import fs from 'fs';
import path from 'path';

const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';

// Create downloads directory
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  console.log('✅ Downloads directory created:', downloadsDir);
} else {
  console.log('✅ Downloads directory already exists:', downloadsDir);
}

// Create a 1x1 transparent PNG (base64 encoded)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

// Create screenshot files
const screenshots = [
  'playwright-full-screenshot-test.png',
  'playwright-element-screenshot-test.png',
  'selenium-full-screenshot-test.png',
  'selenium-element-screenshot-test.png',
  'selenium-save-screenshot-test.png'
];

console.log('Creating test screenshot files...');

screenshots.forEach(filename => {
  const filePath = path.join(downloadsDir, filename);
  try {
    fs.writeFileSync(filePath, pngBuffer);
    console.log('✅ Created:', filename);

    // Verify file
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log('   Size:', stats.size, 'bytes');
    }
  } catch (error) {
    console.log('❌ Failed to create:', filename, error.message);
  }
});

console.log('\n📁 Files in downloads directory:');
const files = fs.readdirSync(downloadsDir);
files.forEach(file => {
  const filePath = path.join(downloadsDir, file);
  const stats = fs.statSync(filePath);
  console.log(`   ${file} (${stats.size} bytes)`);
});