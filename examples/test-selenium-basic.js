// Test basic Selenium functionality without profiles
import { SeleniumChromeProfile } from '../esm/index.js';

async function testBasicSelenium() {
  console.log('🔧 Testing basic Selenium without profile...');

  const chrome = new SeleniumChromeProfile({
    headless: false,
    email: '', // Empty email = no profile usage
    arguments: [
      '--no-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-gpu'
    ]
  });

  try {
    console.log('🌐 Visiting google.com...');
    await chrome.goto('https://www.google.com');
    
    // Wait for page to load
    await chrome.driver.sleep(3000);
    
    console.log('📸 Taking screenshot...');
    const screenshot = await chrome._getFullScreenshot();
    
    console.log(`✅ Screenshot taken: ${screenshot.length} bytes`);
    console.log('⏳ Waiting 5 seconds before closing...');
    await chrome.driver.sleep(5000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await chrome.close();
    console.log('🔧 Browser closed');
  }
}

testBasicSelenium().catch(console.error);