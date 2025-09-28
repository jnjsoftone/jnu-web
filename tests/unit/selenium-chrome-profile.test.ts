import fs from 'fs';
import path from 'path';
import { Builder } from 'selenium-webdriver';
import { SeleniumChromeProfile, getSeleniumChromeProfileByEmail } from '../../src/selenium-chrome-profile';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('selenium-webdriver');
jest.mock('jnu-abc', () => ({
  loadJson: jest.fn(),
  saveFile: jest.fn(),
  sleepAsync: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockBuilder = Builder as jest.MockedClass<typeof Builder>;

describe('Selenium Chrome Profile Module', () => {
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

  describe('getSeleniumChromeProfileByEmail', () => {
    it('should return null if userDataDir is empty', () => {
      const result = getSeleniumChromeProfileByEmail('test@example.com', '');
      expect(result).toBeNull();
    });

    it('should return null if userDataDir is not provided', () => {
      const result = getSeleniumChromeProfileByEmail('test@example.com');
      expect(result).toBeNull();
    });

    it('should find profile by email successfully', () => {
      console.log('\n🔍 [TEST] getSeleniumChromeProfileByEmail - Find profile by email');

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

      console.log('🔄 Executing getSeleniumChromeProfileByEmail...');
      const result = getSeleniumChromeProfileByEmail(targetEmail, userDataDir);

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

      const result = getSeleniumChromeProfileByEmail('test@example.com', '/test');

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

      const result = getSeleniumChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Skipping profile folder /test/Profile 1: Invalid JSON'
      );
    });

    it('should handle directory read errors', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = getSeleniumChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Error reading directory /test: Permission denied'
      );
    });

    it('should return null if profile not found', () => {
      const mockLoadJson = require('jnu-abc').loadJson;

      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');

      mockLoadJson.mockReturnValue({
        account_info: [{ email: 'other@example.com' }]
      });

      const result = getSeleniumChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBeNull();
    });

    it('should handle profiles without account_info', () => {
      const mockLoadJson = require('jnu-abc').loadJson;

      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');

      mockLoadJson.mockReturnValue({});

      const result = getSeleniumChromeProfileByEmail('test@example.com', '/test');

      expect(result).toBeNull();
    });
  });

  describe('SeleniumChromeProfile', () => {
    let mockDriver: any;
    let mockWebDriverBuilder: any;

    beforeEach(() => {
      mockDriver = {
        get: jest.fn(),
        quit: jest.fn(),
        getTitle: jest.fn(),
        getPageSource: jest.fn(),
        takeScreenshot: jest.fn(),
        findElement: jest.fn(),
        findElements: jest.fn(),
        wait: jest.fn(),
        executeScript: jest.fn(),
        manage: jest.fn(() => ({
          window: jest.fn(() => ({
            setRect: jest.fn(),
          })),
        })),
        sleep: jest.fn(),
      };

      mockWebDriverBuilder = {
        forBrowser: jest.fn().mockReturnThis(),
        setChromeOptions: jest.fn().mockReturnThis(),
        build: jest.fn().mockResolvedValue(mockDriver),
      };

      mockBuilder.mockImplementation(() => mockWebDriverBuilder);
    });

    it('should create SeleniumChromeProfile instance with default options', () => {
      const chrome = new SeleniumChromeProfile();

      expect(chrome).toBeInstanceOf(SeleniumChromeProfile);
    });

    it('should initialize with headless mode', async () => {
      const chrome = new SeleniumChromeProfile({ headless: true });

      // Wait for initialization to complete
      await chrome['ensureInitialized']();

      expect(mockWebDriverBuilder.forBrowser).toHaveBeenCalledWith('chrome');
      expect(mockWebDriverBuilder.setChromeOptions).toHaveBeenCalled();
      expect(mockWebDriverBuilder.build).toHaveBeenCalled();
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

      const chrome = new SeleniumChromeProfile({
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

      // Mock getSeleniumChromeProfileByEmail to return a profile
      const mockLoadJson = require('jnu-abc').loadJson;
      mockFs.readdirSync.mockReturnValue(['Profile 1'] as any);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockPath.join.mockReturnValue('/test/Profile 1');
      mockLoadJson.mockReturnValue({
        account_info: [{ email: 'test@example.com' }]
      });

      const chrome = new SeleniumChromeProfile({
        email: 'test@example.com',
        userDataDir: '/test'
      });

      await chrome['ensureInitialized']();

      expect(console.log).toHaveBeenCalledWith(
        '✅ Profile settings forced in container environment'
      );
    });

    it('should navigate to URL', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      await chrome.goto('https://example.com');

      expect(mockDriver.get).toHaveBeenCalledWith('https://example.com');
    });

    it('should get page source', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      mockDriver.getPageSource.mockResolvedValue('<html><body>Test</body></html>');

      const pageSource = await chrome.getPageSource();

      expect(mockDriver.getPageSource).toHaveBeenCalled();
      expect(pageSource).toBe('<html><body>Test</body></html>');
    });

    it('should find element by CSS selector', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      const mockElement = { click: jest.fn() };
      mockDriver.findElement.mockResolvedValue(mockElement);

      const element = await chrome.findElement('.test-class');

      expect(mockDriver.findElement).toHaveBeenCalled();
      expect(element).toBe(mockElement);
    });

    it('should close browser', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      await chrome.close();

      expect(mockDriver.quit).toHaveBeenCalled();
    });

    it('should handle custom chrome arguments', async () => {
      const customArgs = ['--disable-web-security', '--allow-running-insecure-content'];

      const chrome = new SeleniumChromeProfile({
        arguments: customArgs
      });

      await chrome['ensureInitialized']();

      expect(mockWebDriverBuilder.setChromeOptions).toHaveBeenCalled();
    });

    it('should set custom Chrome executable path', async () => {
      process.env.CHROMIUM_EXECUTABLE_PATH = '/custom/chrome/path';

      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      expect(mockWebDriverBuilder.setChromeOptions).toHaveBeenCalled();
    });

    it('should take full screenshot', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      // Mock getFullSize method to avoid JavaScript execution issues
      chrome['getFullSize'] = jest.fn().mockResolvedValue({ width: 1920, height: 1080 });

      const mockScreenshotData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      mockDriver.takeScreenshot.mockResolvedValue(mockScreenshotData);

      const screenshot = await chrome._getFullScreenshot();

      expect(mockDriver.takeScreenshot).toHaveBeenCalled();
      expect(screenshot).toBe(mockScreenshotData);

      // Note: Screenshots will be created automatically after tests complete via package.json script
    });

    it('should save screenshot to file', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      // Mock getFullSize method to avoid JavaScript execution issues
      chrome['getFullSize'] = jest.fn().mockResolvedValue({ width: 1920, height: 1080 });

      const mockSaveFile = require('jnu-abc').saveFile;
      const mockScreenshotData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      mockDriver.takeScreenshot.mockResolvedValue(mockScreenshotData);

      const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';
      const screenshotPath = downloadsDir + '/selenium-save-screenshot-test.png';

      await chrome.saveScreenshot(screenshotPath);

      expect(mockDriver.takeScreenshot).toHaveBeenCalled();
      expect(mockSaveFile).toHaveBeenCalledWith(screenshotPath, mockScreenshotData, { encoding: 'base64' });
    });

    it('should save element screenshot', async () => {
      const chrome = new SeleniumChromeProfile();
      await chrome['ensureInitialized']();

      const mockSaveFile = require('jnu-abc').saveFile;
      const mockScreenshotData = 'element-screenshot-data';
      const mockElement = {
        takeScreenshot: jest.fn().mockResolvedValue(mockScreenshotData),
      };
      mockDriver.findElement.mockResolvedValue(mockElement);

      const downloadsDir = '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads';
      const screenshotPath = downloadsDir + '/selenium-element-screenshot-test.png';

      await chrome.saveElementScreenshot('.element', screenshotPath);

      expect(mockDriver.findElement).toHaveBeenCalled();
      expect(mockElement.takeScreenshot).toHaveBeenCalled();
      expect(mockSaveFile).toHaveBeenCalledWith(screenshotPath, mockScreenshotData, { encoding: 'base64' });
    });
  });
});