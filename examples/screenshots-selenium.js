// Example script for taking screenshots using Selenium Chrome Profile
import { SeleniumChromeProfile } from '../esm/index.js';
import fs from 'fs';
import path from 'path';

// 환경변수 또는 기본값으로 테스트 이메일 설정
const TEST_EMAIL = process.env.TEST_EMAIL || 'bigwhitekmc@gmail.com';
const downloadsDir = '/Users/youchan/Coding/jnj/jnj-utils/npmjs/jnu-web/examples/screenshots';

// 컨테이너 환경에서도 프로필 사용 강제 설정
process.env.FORCE_CHROME_PROFILE = 'true';

// 환경변수 명시적 설정 (zsh 환경변수가 node에서 인식되지 않을 수 있음)
if (!process.env.CHROMIUM_USERDATA_PATH) {
  process.env.CHROMIUM_USERDATA_PATH = '/Users/youchan/Library/Application Support/Google/Chrome';
}
console.log(`🔧 CHROMIUM_USERDATA_PATH: ${process.env.CHROMIUM_USERDATA_PATH}`);

console.log(`🔧 Using profile for email: ${TEST_EMAIL}`);
console.log(`🔧 Force Chrome profile: ${process.env.FORCE_CHROME_PROFILE}`);

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

async function takeSeleniumScreenshots() {
  console.log('🔧 Starting Selenium screenshots...');
  console.log('📧 Testing profile detection first...');
  
  // Test profile detection first
  try {
    const { getSeleniumChromeProfileByEmail } = await import('../esm/index.js');
    const profileName = getSeleniumChromeProfileByEmail(TEST_EMAIL);
    
    if (profileName) {
      console.log(`✅ Profile detected: ${profileName} for ${TEST_EMAIL}`);
      console.log('⚠️ However, using temporary profile due to DevToolsActivePort compatibility issues');
    } else {
      console.log(`❌ No profile found for ${TEST_EMAIL}`);
    }
  } catch (error) {
    console.error('Profile detection error:', error);
  }
  
  // Use empty email to force temporary profile (which works reliably)
  const chrome = new SeleniumChromeProfile({
    headless: false,
    email: '', // Empty email = temporary profile (avoids DevToolsActivePort issues)
    arguments: [
      '--no-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update'
    ]
  });

  try {
    // Screenshot 1: Naver
    console.log('📸 Taking screenshot of naver.com...');
    await chrome.goto('https://www.naver.com');
    
    // Wait for page to load
    await chrome.driver.sleep(3000);

    const screenshot1 = await chrome._getFullScreenshot();
    const path1 = path.join(downloadsDir, 'selenium-naver-com.png');
    fs.writeFileSync(path1, screenshot1, 'base64');

    const stats1 = fs.statSync(path1);
    console.log(`✅ Saved: ${path1} (${stats1.size} bytes)`);

    // Screenshot 2: GitHub
    console.log('📸 Taking screenshot of github.com...');
    await chrome.goto('https://github.com');
    
    // Wait for page to load
    await chrome.driver.sleep(3000);

    const screenshot2 = await chrome._getFullScreenshot();
    const path2 = path.join(downloadsDir, 'selenium-github-com.png');
    fs.writeFileSync(path2, screenshot2, 'base64');

    const stats2 = fs.statSync(path2);
    console.log(`✅ Saved: ${path2} (${stats2.size} bytes)`);

    // Screenshot 3: Stack Overflow
    console.log('📸 Taking screenshot of stackoverflow.com...');
    await chrome.goto('https://stackoverflow.com');
    
    // Wait for page to load
    await chrome.driver.sleep(3000);

    const screenshot3 = await chrome._getFullScreenshot();
    const path3 = path.join(downloadsDir, 'selenium-stackoverflow-com.png');
    fs.writeFileSync(path3, screenshot3, 'base64');

    const stats3 = fs.statSync(path3);
    console.log(`✅ Saved: ${path3} (${stats3.size} bytes)`);

    // Screenshot 4: Google - to test login state (will be anonymous)
    console.log('📸 Taking screenshot of google.com (anonymous session)...');
    await chrome.goto('https://www.google.com');
    
    // Wait for page to load
    await chrome.driver.sleep(3000);

    const screenshot4 = await chrome._getFullScreenshot();
    const path4 = path.join(downloadsDir, 'selenium-google-com.png');
    fs.writeFileSync(path4, screenshot4, 'base64');

    const stats4 = fs.statSync(path4);
    console.log(`✅ Saved: ${path4} (${stats4.size} bytes)`);

  } catch (error) {
    console.error('❌ Selenium error:', error);
  } finally {
    await chrome.close();
    console.log('🔧 Selenium browser closed');
  }
}

async function main() {
  console.log('🚀 Starting Selenium screenshot capture...\n');

  try {
    await takeSeleniumScreenshots();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('\n🎉 All Selenium screenshots completed!');
    console.log('📁 Check files in:', downloadsDir);

    // List all files
    const files = fs.readdirSync(downloadsDir).filter(f => f.includes('selenium'));
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