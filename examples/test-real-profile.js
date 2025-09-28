// Test real Chrome profile with enhanced stability settings
import { SeleniumChromeProfile } from '../esm/index.js';

// 환경변수 설정
const TEST_EMAIL = process.env.TEST_EMAIL || 'bigwhitekmc@gmail.com';
process.env.FORCE_CHROME_PROFILE = 'true';

if (!process.env.CHROMIUM_USERDATA_PATH) {
  process.env.CHROMIUM_USERDATA_PATH = '/Users/youchan/Library/Application Support/Google/Chrome';
}

console.log(`🔧 Testing real Chrome profile for: ${TEST_EMAIL}`);
console.log(`🔧 CHROMIUM_USERDATA_PATH: ${process.env.CHROMIUM_USERDATA_PATH}`);
console.log(`🔧 Force Chrome profile: ${process.env.FORCE_CHROME_PROFILE}`);

async function testRealProfile() {
  console.log('🔧 Starting real Chrome profile test...');

  const chrome = new SeleniumChromeProfile({
    headless: false,
    email: TEST_EMAIL,  // Use real email to get actual profile
    arguments: [
      // Minimal additional arguments for real profile
      '--disable-popup-blocking',
      '--ignore-certificate-errors'
    ]
  });

  try {
    console.log('🌐 Visiting Google to test login state...');
    await chrome.goto('https://www.google.com');
    
    // Wait for page to load
    await chrome.driver.sleep(5000);
    
    // Check if logged in by looking for profile indicator
    try {
      const pageTitle = await chrome.driver.getTitle();
      const currentUrl = chrome.driver.getCurrentUrl();
      
      console.log(`📄 Page Title: ${pageTitle}`);
      console.log(`🔗 Current URL: ${await currentUrl}`);
      
      // Try to find user profile elements (this may vary)
      try {
        const userElements = await chrome.driver.findElements({ css: '[aria-label*="Google Account"], [data-ved], .gb_A, .gb_B' });
        if (userElements.length > 0) {
          console.log('✅ Profile elements detected - likely logged in');
        } else {
          console.log('⚠️ No obvious profile elements found');
        }
      } catch (error) {
        console.log('ℹ️ Could not check for profile elements');
      }
      
    } catch (error) {
      console.error('Error checking page state:', error);
    }
    
    console.log('⏳ Browser will stay open for 15 seconds for manual inspection...');
    await chrome.driver.sleep(15000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If DevToolsActivePort error occurs, suggest solutions
    if (error.message.includes('DevToolsActivePort')) {
      console.log('\n💡 DevToolsActivePort 에러 해결 방법:');
      console.log('1. 기존 Chrome 프로세스 종료: pkill -f "Google Chrome"');
      console.log('2. Chrome 프로필 잠금 파일 삭제');
      console.log('3. 잠시 후 다시 시도');
    }
    
  } finally {
    await chrome.close();
    console.log('🔧 Browser closed');
  }
}

testRealProfile().catch(console.error);