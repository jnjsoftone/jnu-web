import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { PlaywrightChromeProfile, getPlaywrightChromeProfileByEmail } from '../../src/playwright-chrome-profile';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('playwright');
jest.mock('jnu-abc', () => ({
  loadJson: jest.fn(),
  saveFile: jest.fn(),
  sleepAsync: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockChromium = chromium as jest.Mocked<typeof chromium>;

describe('Playwright Chrome Profile Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods to avoid noise in tests (except for data flow logging)
    jest.spyOn(console, 'log'); // Spy on console.log for verification while still allowing output
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset environment variables
    delete process.env.DOCKER_CONTAINER;
    delete process.env.CI;
    delete process.env.FORCE_CHROME_PROFILE;
    delete process.env.CHROMIUM_EXECUTABLE_PATH;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPlaywrightChromeProfileByEmail', () => {
    it('should return null if userDataDir is empty', () => {
      console.log('\n🔍 [TEST] getPlaywrightChromeProfileByEmail - Empty userDataDir');

      const email = 'test@example.com';
      const userDataDir = '';

      console.log('📋 Input parameters:');
      console.log('   email:', email);
      console.log('   userDataDir:', userDataDir);

      const result = getPlaywrightChromeProfileByEmail(email, userDataDir);

      console.log('📤 Result:', result);
      console.log('✅ Expected: null (empty userDataDir should return null)');

      expect(result).toBeNull();
    });

    it('should return null if userDataDir is not provided', () => {
      console.log('\n🔍 [TEST] getPlaywrightChromeProfileByEmail - No userDataDir');

      const email = 'test@example.com';

      console.log('📋 Input parameters:');
      console.log('   email:', email);
      console.log('   userDataDir: undefined (not provided)');

      const result = getPlaywrightChromeProfileByEmail(email);

      console.log('📤 Result:', result);
      console.log('✅ Expected: null (undefined userDataDir should return null)');

      expect(result).toBeNull();
    });

    it('should find profile by email successfully', () => {
      console.log('\n🔍 [TEST] getPlaywrightChromeProfileByEmail - Find profile by email');

      const mockLoadJson = require('jnu-abc').loadJson;
      const targetEmail = 'test@example.com';
      const userDataDir = '/test';

      console.log('📋 Input parameters:');
      console.log('   email:', targetEmail);
      console.log('   userDataDir:', userDataDir);

      // Mock fs.readdirSync to return profile directories
      const mockDirContents = ['Profile 1', 'Profile 2', 'Other'];
      mockFs.readdirSync.mockReturnValue(mockDirContents as any);
      console.log('📁 Mocked directory contents:', mockDirContents);

      // Mock fs.statSync for profile directories
      mockFs.statSync
        .mockReturnValueOnce({ isDirectory: () => true } as any)
        .mockReturnValueOnce({ isDirectory: () => true } as any);

      // Mock path.join
      mockPath.join
        .mockReturnValueOnce('/test/Profile 1')
        .mockReturnValueOnce('/test/Profile 2');

      // Mock loadJson to return profile preferences
      const profile1Data = { account_info: [{ email: 'other@example.com' }] };
      const profile2Data = { account_info: [{ email: 'test@example.com' }] };

      mockLoadJson
        .mockReturnValueOnce(profile1Data)
        .mockReturnValueOnce(profile2Data);

      console.log('📊 Mocked profile data:');
      console.log('   Profile 1 data:', JSON.stringify(profile1Data, null, 2));
      console.log('   Profile 2 data:', JSON.stringify(profile2Data, null, 2));

      console.log('🔄 Executing getPlaywrightChromeProfileByEmail...');
      const result = getPlaywrightChromeProfileByEmail(targetEmail, userDataDir);

      console.log('📤 Result:', result);
      console.log('✅ Expected: "Profile 2" (should find profile with matching email)');

      expect(result).toBe('Profile 2');
      expect(mockLoadJson).toHaveBeenCalledWith('/test/Profile 1/Preferences');
      expect(mockLoadJson).toHaveBeenCalledWith('/test/Profile 2/Preferences');

      console.log('✅ Function call verification passed');
    });

    it('should handle broken symlinks gracefully', () => {
      mockFs.readdirSync.mockReturnValue(['Profile 1', 'Profile 2'] as any);

      // First profile throws error (broken symlink)
      mockFs.statSync
        .mockImplementationOnce(() => {
          throw new Error('ENOENT: no such file or directory');
        })
        .mockReturnValueOnce({ isDirectory: () => true } as any);

      mockPath.join
        .mockReturnValueOnce('/test/Profile 1')
        .mockReturnValueOnce('/test/Profile 2');

      const mockLoadJson = require('jnu-abc').loadJson;
      mockLoadJson.mockReturnValue({
        account_info: [{ email: 'test@example.com' }]
      });

      const result = getPlaywrightChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBe('Profile 2');
    });

    it('should handle invalid preferences files', () => {
      const mockLoadJson = require('jnu-abc').loadJson;

      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');

      // Mock loadJson to throw error for invalid JSON
      mockLoadJson.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = getPlaywrightChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Skipping profile folder /test/Profile 1: Invalid JSON'
      );
    });
  });

  describe('PlaywrightChromeProfile', () => {
    let mockBrowser: any;
    let mockContext: any;
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        goto: jest.fn(),
        content: jest.fn(),
        screenshot: jest.fn(),
        setViewportSize: jest.fn(),
        locator: jest.fn(),
        waitForSelector: jest.fn(),
        waitForTimeout: jest.fn(),
        waitForFunction: jest.fn(),
        evaluate: jest.fn(),
        addInitScript: jest.fn(),
        close: jest.fn(),
        title: jest.fn(),
      };

      mockContext = {
        browser: jest.fn(),
        newPage: jest.fn().mockResolvedValue(mockPage),
        pages: jest.fn().mockReturnValue([mockPage]),
        close: jest.fn(),
      };

      mockBrowser = {
        newContext: jest.fn().mockResolvedValue(mockContext),
        close: jest.fn(),
      };

      mockChromium.launch.mockResolvedValue(mockBrowser);
      mockChromium.launchPersistentContext.mockResolvedValue(mockContext);
    });

    it('should create PlaywrightChromeProfile instance with default options', () => {
      const chrome = new PlaywrightChromeProfile();

      expect(chrome).toBeInstanceOf(PlaywrightChromeProfile);
    });

    it('should initialize with headless mode', async () => {
      console.log('\n🔍 [TEST] PlaywrightChromeProfile - Initialize with headless mode');

      const options = { headless: true };
      console.log('📋 Input options:', JSON.stringify(options, null, 2));

      console.log('🏗️ Creating PlaywrightChromeProfile instance...');
      const chrome = new PlaywrightChromeProfile(options);

      console.log('⚡ Calling ensureInitialized...');
      // Wait for initialization to complete
      await chrome['ensureInitialized']();

      console.log('🔍 Verifying chromium.launch call...');
      const expectedLaunchConfig = {
        headless: true,
        args: expect.arrayContaining(['--disable-gpu', '--no-sandbox'])
      };
      console.log('📋 Expected launch config:', JSON.stringify(expectedLaunchConfig, null, 2));

      expect(mockChromium.launch).toHaveBeenCalledWith(
        expect.objectContaining(expectedLaunchConfig)
      );

      console.log('✅ Chromium launch verification passed');
      console.log('🎯 Headless mode initialization completed successfully');
    });

    it('should handle container environment profile skipping', async () => {
      process.env.CI = 'true';

      // Mock profile finding to return a profile
      const mockLoadJson = require('jnu-abc').loadJson;
      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');
      mockLoadJson.mockReturnValue({
        account_info: [{ email: 'test@example.com' }]
      });

      const chrome = new PlaywrightChromeProfile({
        email: 'test@example.com',
        userDataDir: '/test'
      });

      await chrome['ensureInitialized']();

      expect(console.warn).toHaveBeenCalledWith(
        'Profile settings skipped in container environment for stability (set FORCE_CHROME_PROFILE=true to override)'
      );
    });

    it('should force profile in container environment when FORCE_CHROME_PROFILE is true', async () => {
      process.env.CI = 'true';
      process.env.FORCE_CHROME_PROFILE = 'true';

      // Mock getPlaywrightChromeProfileByEmail to return a profile
      const mockLoadJson = require('jnu-abc').loadJson;
      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');
      mockLoadJson.mockReturnValue({
        account_info: [{ email: 'test@example.com' }]
      });

      const chrome = new PlaywrightChromeProfile({
        email: 'test@example.com',
        userDataDir: '/test'
      });

      await chrome['ensureInitialized']();

      expect(console.log).toHaveBeenCalledWith(
        '✅ Profile settings forced in container environment'
      );
      expect(mockChromium.launchPersistentContext).toHaveBeenCalled();
    });

    it('should navigate to URL', async () => {
      console.log('\n🔍 [TEST] PlaywrightChromeProfile - Navigate to URL');

      const targetUrl = 'https://example.com';
      console.log('📋 Target URL:', targetUrl);

      console.log('🏗️ Creating PlaywrightChromeProfile instance...');
      const chrome = new PlaywrightChromeProfile();

      console.log('⚡ Initializing chrome instance...');
      await chrome['ensureInitialized']();

      console.log('🌐 Navigating to URL...');
      await chrome.goto(targetUrl);

      const expectedGotoCall = {
        url: targetUrl,
        options: { waitUntil: 'domcontentloaded' }
      };
      console.log('📋 Expected goto call:', JSON.stringify(expectedGotoCall, null, 2));

      expect(mockPage.goto).toHaveBeenCalledWith(targetUrl, {
        waitUntil: 'domcontentloaded'
      });

      console.log('✅ Navigation verification passed');
      console.log('🎯 URL navigation completed successfully');
    });

    it('should get page source', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      mockPage.content.mockResolvedValue('<html><body>Test</body></html>');

      const pageSource = await chrome.getPageSource();

      expect(mockPage.content).toHaveBeenCalled();
      expect(pageSource).toBe('<html><body>Test</body></html>');
    });

    it('should find element by CSS selector', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockLocator = { first: jest.fn().mockReturnThis() };
      mockPage.locator.mockReturnValue(mockLocator);

      const element = await chrome.findElement('.test-class');

      expect(mockPage.locator).toHaveBeenCalledWith('.test-class');
      expect(mockLocator.first).toHaveBeenCalled();
    });

    it('should wait for selector', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      await chrome.wait('.test-selector', { timeout: 5000, state: 'visible' });

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.test-selector', {
        timeout: 5000,
        state: 'visible'
      });
    });

    it('should click element', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockSleepAsync = require('jnu-abc').sleepAsync;
      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        scrollIntoViewIfNeeded: jest.fn(),
        click: jest.fn(),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await chrome.click('.button');

      expect(mockPage.locator).toHaveBeenCalledWith('.button');
      expect(mockLocator.scrollIntoViewIfNeeded).toHaveBeenCalled();
      expect(mockSleepAsync).toHaveBeenCalledWith(1000);
      expect(mockLocator.click).toHaveBeenCalled();
    });

    it('should get element text', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        textContent: jest.fn().mockResolvedValue('Test text'),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      const text = await chrome.getText('.text-element');

      expect(mockPage.locator).toHaveBeenCalledWith('.text-element');
      expect(mockLocator.textContent).toHaveBeenCalled();
      expect(text).toBe('Test text');
    });

    it('should get element attribute', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        getAttribute: jest.fn().mockResolvedValue('attribute-value'),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      const attribute = await chrome.getAttribute('.element', 'data-test');

      expect(mockPage.locator).toHaveBeenCalledWith('.element');
      expect(mockLocator.getAttribute).toHaveBeenCalledWith('data-test');
      expect(attribute).toBe('attribute-value');
    });

    it('should send keys to element', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        fill: jest.fn(),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await chrome.sendKeys('input[name="username"]', 'testuser');

      expect(mockPage.locator).toHaveBeenCalledWith('input[name="username"]');
      expect(mockLocator.fill).toHaveBeenCalledWith('testuser');
    });

    it('should take full screenshot', async () => {
      console.log('\n🔍 [TEST] PlaywrightChromeProfile - Take full screenshot');

      console.log('🏗️ Creating PlaywrightChromeProfile instance...');
      const chrome = new PlaywrightChromeProfile();

      console.log('⚡ Initializing chrome instance...');
      await chrome['ensureInitialized']();

      // Mock getFullSize method
      const mockFullSize = { width: 1920, height: 1080 };
      chrome['getFullSize'] = jest.fn().mockResolvedValue(mockFullSize);
      console.log('📐 Mocked full size:', JSON.stringify(mockFullSize, null, 2));

      const mockScreenshotBuffer = Buffer.from('screenshot data');
      mockPage.screenshot.mockResolvedValue(mockScreenshotBuffer);
      console.log('📊 Mocked screenshot buffer size:', mockScreenshotBuffer.length, 'bytes');

      console.log('📸 Taking full screenshot...');
      const screenshot = await chrome._getFullScreenshot();

      console.log('📤 Screenshot result buffer size:', screenshot.length, 'bytes');
      console.log('🔍 Verifying viewport size was set...');

      expect(mockPage.setViewportSize).toHaveBeenCalledWith(mockFullSize);
      console.log('✅ Viewport size verification passed');

      console.log('🔍 Verifying screenshot call...');
      const expectedScreenshotOptions = { fullPage: true, type: 'png' };
      console.log('📋 Expected screenshot options:', JSON.stringify(expectedScreenshotOptions, null, 2));

      expect(mockPage.screenshot).toHaveBeenCalledWith(expectedScreenshotOptions);
      console.log('✅ Screenshot call verification passed');

      expect(screenshot).toBe(mockScreenshotBuffer);
      console.log('✅ Screenshot buffer verification passed');

      console.log('🎯 Full screenshot capture completed successfully');
      // Note: Screenshots will be created automatically after tests complete via package.json script
    });

    it('should save element screenshot', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockSaveFile = require('jnu-abc').saveFile;
      const mockScreenshotBuffer = Buffer.from('element screenshot');
      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        screenshot: jest.fn().mockResolvedValue(mockScreenshotBuffer),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';
      const screenshotPath = downloadsDir + '/playwright-element-screenshot-test.png';

      await chrome.saveElementScreenshot('.element', screenshotPath);

      expect(mockPage.locator).toHaveBeenCalledWith('.element');
      expect(mockLocator.screenshot).toHaveBeenCalledWith({ type: 'png' });
      expect(mockSaveFile).toHaveBeenCalledWith(
        screenshotPath,
        mockScreenshotBuffer.toString('base64'),
        { encoding: 'base64' }
      );
    });

    it('should execute script', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockResult = { title: 'Test Page' };
      mockPage.evaluate.mockResolvedValue(mockResult);

      const result = await chrome.executeScript('return document.title');

      expect(mockPage.evaluate).toHaveBeenCalledWith('return document.title');
      expect(result).toBe(mockResult);
    });

    it('should close browser', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      await chrome.close();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle custom chrome arguments', async () => {
      const customArgs = ['--disable-web-security', '--allow-running-insecure-content'];

      const chrome = new PlaywrightChromeProfile({
        arguments: customArgs
      });

      await chrome['ensureInitialized']();

      expect(mockChromium.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining(customArgs)
        })
      );
    });

    it('should set custom Chrome executable path', async () => {
      process.env.CHROMIUM_EXECUTABLE_PATH = '/custom/chrome/path';

      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      expect(mockChromium.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          executablePath: '/custom/chrome/path'
        })
      );
    });

    it('should scroll element into view', async () => {
      const chrome = new PlaywrightChromeProfile();
      await chrome['ensureInitialized']();

      const mockLocator = {
        first: jest.fn().mockReturnThis(),
        scrollIntoViewIfNeeded: jest.fn(),
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await chrome.scrollIntoView('.element');

      expect(mockPage.locator).toHaveBeenCalledWith('.element');
      expect(mockLocator.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });
  });
});