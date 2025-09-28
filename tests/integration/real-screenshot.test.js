// Integration test for real screenshot functionality
import { PlaywrightChromeProfile } from '../../src/playwright-chrome-profile.js';
import { SeleniumChromeProfile } from '../../src/selenium-chrome-profile.js';
import fs from 'fs';
import path from 'path';

const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';

describe('Real Screenshot Integration Tests', () => {
  beforeAll(() => {
    // Ensure downloads directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  });

  describe('Playwright Real Screenshots', () => {
    let chrome;

    afterEach(async () => {
      if (chrome) {
        try {
          await chrome.close();
        } catch (error) {
          console.log('Error closing browser:', error.message);
        }
      }
    });

    it('should take real screenshot of example.com', async () => {
      chrome = new PlaywrightChromeProfile({ headless: true });

      console.log('🌐 Navigating to example.com...');
      await chrome.goto('https://example.com');

      const screenshotPath = path.join(downloadsDir, 'playwright-real-example-com.png');
      console.log('📸 Taking screenshot:', screenshotPath);

      const screenshot = await chrome._getFullScreenshot();
      fs.writeFileSync(screenshotPath, screenshot);

      // Verify file was created and has reasonable size
      expect(fs.existsSync(screenshotPath)).toBe(true);
      const stats = fs.statSync(screenshotPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be larger than 1KB

      console.log('✅ Real screenshot saved:', screenshotPath, `(${stats.size} bytes)`);
    }, 30000);

    it('should take real screenshot of Google homepage', async () => {
      chrome = new PlaywrightChromeProfile({ headless: true });

      console.log('🌐 Navigating to google.com...');
      await chrome.goto('https://google.com');

      const screenshotPath = path.join(downloadsDir, 'playwright-real-google-com.png');
      console.log('📸 Taking screenshot:', screenshotPath);

      const screenshot = await chrome._getFullScreenshot();
      fs.writeFileSync(screenshotPath, screenshot);

      // Verify file was created and has reasonable size
      expect(fs.existsSync(screenshotPath)).toBe(true);
      const stats = fs.statSync(screenshotPath);
      expect(stats.size).toBeGreaterThan(5000); // Google page should be larger

      console.log('✅ Real screenshot saved:', screenshotPath, `(${stats.size} bytes)`);
    }, 30000);
  });

  describe('Selenium Real Screenshots', () => {
    let chrome;

    afterEach(async () => {
      if (chrome) {
        try {
          await chrome.close();
        } catch (error) {
          console.log('Error closing browser:', error.message);
        }
      }
    });

    it('should take real screenshot of example.com with Selenium', async () => {
      chrome = new SeleniumChromeProfile({ headless: true });

      console.log('🌐 Navigating to example.com with Selenium...');
      await chrome.goto('https://example.com');

      const screenshotPath = path.join(downloadsDir, 'selenium-real-example-com.png');
      console.log('📸 Taking screenshot:', screenshotPath);

      await chrome.saveScreenshot(screenshotPath);

      // Verify file was created and has reasonable size
      expect(fs.existsSync(screenshotPath)).toBe(true);
      const stats = fs.statSync(screenshotPath);
      expect(stats.size).toBeGreaterThan(1000); // Should be larger than 1KB

      console.log('✅ Real screenshot saved:', screenshotPath, `(${stats.size} bytes)`);
    }, 30000);
  });
});