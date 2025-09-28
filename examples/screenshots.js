// Example script for taking real screenshots
import { PlaywrightChromeProfile, SeleniumChromeProfile } from '../esm/index.js';
import fs from 'fs';
import path from 'path';

// 환경변수 또는 기본값으로 테스트 이메일 설정
const TEST_EMAIL = process.env.TEST_EMAIL || 'bigwhitekmc@gmail.com';
// const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';
const downloadsDir = '/Users/youchan/Coding/jnj/jnj-utils/npmjs/jnu-web/examples/screenshots';

// 컨테이너 환경에서도 프로필 사용 강제 설정
process.env.FORCE_CHROME_PROFILE = 'true';

console.log(`🔧 Using profile for email: ${TEST_EMAIL}`);
console.log(`🔧 Force Chrome profile: ${process.env.FORCE_CHROME_PROFILE}`);

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

async function takePlaywrightScreenshots() {
  console.log('🎭 Starting Playwright screenshots...');

  const chrome = new PlaywrightChromeProfile({
    headless: true,
    email: TEST_EMAIL,
    arguments: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // Screenshot 1: Example.com
    console.log('📸 Taking screenshot of example.com...');
    await chrome.goto('https://www.naver.com');

    const screenshot1 = await chrome._getFullScreenshot();
    const path1 = path.join(downloadsDir, 'playwright-example-com.png');
    fs.writeFileSync(path1, screenshot1);

    const stats1 = fs.statSync(path1);
    console.log(`✅ Saved: ${path1} (${stats1.size} bytes)`);

    // Screenshot 2: GitHub
    console.log('📸 Taking screenshot of github.com...');
    await chrome.goto('https://github.com');

    const screenshot2 = await chrome._getFullScreenshot();
    const path2 = path.join(downloadsDir, 'playwright-github-com.png');
    fs.writeFileSync(path2, screenshot2);

    const stats2 = fs.statSync(path2);
    console.log(`✅ Saved: ${path2} (${stats2.size} bytes)`);

    // Screenshot 3: Stack Overflow
    console.log('📸 Taking screenshot of stackoverflow.com...');
    await chrome.goto('https://stackoverflow.com');

    const screenshot3 = await chrome._getFullScreenshot();
    const path3 = path.join(downloadsDir, 'playwright-stackoverflow-com.png');
    fs.writeFileSync(path3, screenshot3);

    const stats3 = fs.statSync(path3);
    console.log(`✅ Saved: ${path3} (${stats3.size} bytes)`);

  } catch (error) {
    console.error('❌ Playwright error:', error);
  } finally {
    await chrome.close();
    console.log('🎭 Playwright browser closed');
  }
}

async function main() {
  console.log('🚀 Starting real screenshot capture...\n');

  try {
    await takePlaywrightScreenshots();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('\n🎉 All screenshots completed!');
    console.log('📁 Check files in:', downloadsDir);

    // List all files
    const files = fs.readdirSync(downloadsDir).filter(f => f.includes('playwright'));
    console.log('\n📋 Generated files:');
    files.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${file} (${stats.size} bytes)`);
    });

  } catch (error) {
    console.error('❌ Main error:', error);
  }
}

// Run the script
main().catch(console.error);