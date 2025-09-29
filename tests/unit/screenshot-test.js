// Simple test to verify screenshot file creation
import fs from 'fs';

const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/unit/downloads';
const screenshotPath = downloadsDir + '/simple-test-screenshot.png';

// Create a simple PNG buffer (1x1 pixel transparent PNG)
const mockPngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

console.log('Creating screenshot file at:', screenshotPath);
fs.writeFileSync(screenshotPath, mockPngData);
console.log('Screenshot file created successfully!');

// Verify file exists
if (fs.existsSync(screenshotPath)) {
  const stats = fs.statSync(screenshotPath);
  console.log('File size:', stats.size, 'bytes');
} else {
  console.log('File was not created!');
}