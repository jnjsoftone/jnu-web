import { chromium } from 'playwright';
import { PlaywrightChromeBasic, gotoByPlaywrightBasic } from '../../src/playwright-chrome-basic';

// Mock playwright
jest.mock('playwright');

const mockChromium = chromium as jest.Mocked<typeof chromium>;

describe('Playwright Chrome Basic Module', () => {
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock page object
    mockPage = {
      goto: jest.fn(),
      close: jest.fn(),
      content: jest.fn(),
      screenshot: jest.fn(),
    };

    // Mock context object
    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    // Mock browser object
    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn(),
    };

    // Mock chromium.launch
    mockChromium.launch.mockResolvedValue(mockBrowser);

    // Reset environment variables
    delete process.env.CHROMIUM_EXECUTABLE_PATH;
  });

  describe('PlaywrightChromeBasic', () => {
    it('should create instance successfully', () => {
      const chrome = new PlaywrightChromeBasic();
      expect(chrome).toBeInstanceOf(PlaywrightChromeBasic);
    });

    it('should initialize with default options', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: false });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      });
      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 }
      });
      expect(mockContext.newPage).toHaveBeenCalled();
      expect(chrome.browser).toBe(mockBrowser);
      expect(chrome.context).toBe(mockContext);
      expect(chrome.page).toBe(mockPage);
    });

    it('should initialize with headless mode', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: true });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      });
    });

    it('should initialize with custom arguments', async () => {
      const chrome = new PlaywrightChromeBasic();
      const customArgs = ['--disable-web-security', '--allow-running-insecure-content'];

      await chrome.initialize({
        headless: false,
        arguments: customArgs
      });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: false,
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--allow-running-insecure-content'
        ],
      });
    });

    it('should set custom Chrome executable path from environment', async () => {
      process.env.CHROMIUM_EXECUTABLE_PATH = '/custom/chrome/path';
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: true });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
        executablePath: '/custom/chrome/path',
      });
    });

    it('should navigate to URL', async () => {
      const chrome = new PlaywrightChromeBasic();
      await chrome.initialize({ headless: true });

      await chrome.goto('https://example.com');

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'domcontentloaded'
      });
    });

    it('should close browser, context, and page', async () => {
      const chrome = new PlaywrightChromeBasic();
      await chrome.initialize({ headless: true });

      await chrome.close();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle partial cleanup on close', async () => {
      const chrome = new PlaywrightChromeBasic();
      await chrome.initialize({ headless: true });

      // Simulate a scenario where page is null
      (chrome as any).page = null;

      await chrome.close();

      // Should not try to close null page, but should close context and browser
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle initialization without options', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({});

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      });
    });

    it('should handle initialization with empty custom arguments', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({
        headless: false,
        arguments: []
      });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      });
    });

    it('should combine default and custom arguments correctly', async () => {
      const chrome = new PlaywrightChromeBasic();
      const customArgs = ['--custom-arg1', '--custom-arg2'];

      await chrome.initialize({
        headless: true,
        arguments: customArgs
      });

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: true,
        args: [
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--custom-arg1',
          '--custom-arg2'
        ],
      });
    });

    it('should create context with correct viewport settings', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: true });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 }
      });
    });
  });

  describe('gotoByPlaywrightBasic', () => {
    it('should create chrome instance and navigate to URL', async () => {
      const result = await gotoByPlaywrightBasic('https://example.com');

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      });
      expect(mockBrowser.newContext).toHaveBeenCalled();
      expect(mockContext.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'domcontentloaded'
      });
      expect(result).toBe(mockPage);
    });

    it('should initialize with non-headless mode by default', async () => {
      await gotoByPlaywrightBasic('https://test.com');

      expect(mockChromium.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: false
        })
      );
    });

    it('should handle different URLs', async () => {
      const testUrls = [
        'https://google.com',
        'https://github.com',
        'http://localhost:3000',
        'https://api.example.com/endpoint'
      ];

      for (const url of testUrls) {
        jest.clearAllMocks();
        mockChromium.launch.mockResolvedValue(mockBrowser);

        const result = await gotoByPlaywrightBasic(url);

        expect(mockPage.goto).toHaveBeenCalledWith(url, {
          waitUntil: 'domcontentloaded'
        });
        expect(result).toBe(mockPage);
      }
    });

    it('should handle errors during browser launch', async () => {
      const error = new Error('Failed to start browser');
      mockChromium.launch.mockRejectedValueOnce(error);

      await expect(gotoByPlaywrightBasic('https://example.com')).rejects.toThrow('Failed to start browser');
    });

    it('should handle errors during context creation', async () => {
      const error = new Error('Failed to create context');
      mockBrowser.newContext.mockRejectedValueOnce(error);

      await expect(gotoByPlaywrightBasic('https://example.com')).rejects.toThrow('Failed to create context');
    });

    it('should handle errors during page creation', async () => {
      const error = new Error('Failed to create page');
      mockContext.newPage.mockRejectedValueOnce(error);

      await expect(gotoByPlaywrightBasic('https://example.com')).rejects.toThrow('Failed to create page');
    });

    it('should handle errors during navigation', async () => {
      const error = new Error('Navigation failed');
      mockPage.goto.mockRejectedValueOnce(error);

      await expect(gotoByPlaywrightBasic('https://invalid-url')).rejects.toThrow('Navigation failed');
    });

    it('should return the page instance', async () => {
      const result = await gotoByPlaywrightBasic('https://example.com');

      expect(result).toBe(mockPage);
      expect(typeof result.goto).toBe('function');
      expect(typeof result.close).toBe('function');
    });

    it('should use custom executable path from environment', async () => {
      process.env.CHROMIUM_EXECUTABLE_PATH = '/custom/chrome/path';

      await gotoByPlaywrightBasic('https://example.com');

      expect(mockChromium.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          executablePath: '/custom/chrome/path'
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should allow using the page returned by gotoByPlaywrightBasic', async () => {
      const page = await gotoByPlaywrightBasic('https://example.com');

      // Mock some page methods for testing
      (page.content as jest.Mock).mockResolvedValue('<html><body>Test</body></html>');
      (page.screenshot as jest.Mock).mockResolvedValue(Buffer.from('screenshot data'));

      const pageContent = await page.content();
      const screenshot = await page.screenshot();

      expect(pageContent).toBe('<html><body>Test</body></html>');
      expect(screenshot).toEqual(Buffer.from('screenshot data'));

      await page.close();
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should work with PlaywrightChromeBasic class directly', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: true });
      await chrome.goto('https://test.com');

      expect(mockPage.goto).toHaveBeenCalledWith('https://test.com', {
        waitUntil: 'domcontentloaded'
      });

      await chrome.close();
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle multiple navigation calls', async () => {
      const chrome = new PlaywrightChromeBasic();
      await chrome.initialize({ headless: true });

      await chrome.goto('https://first.com');
      await chrome.goto('https://second.com');
      await chrome.goto('https://third.com');

      expect(mockPage.goto).toHaveBeenNthCalledWith(1, 'https://first.com', {
        waitUntil: 'domcontentloaded'
      });
      expect(mockPage.goto).toHaveBeenNthCalledWith(2, 'https://second.com', {
        waitUntil: 'domcontentloaded'
      });
      expect(mockPage.goto).toHaveBeenNthCalledWith(3, 'https://third.com', {
        waitUntil: 'domcontentloaded'
      });
    });

    it('should handle reinitialization', async () => {
      const chrome = new PlaywrightChromeBasic();

      await chrome.initialize({ headless: true });
      await chrome.close();

      // Reinitialize with different options
      await chrome.initialize({ headless: false });

      expect(mockChromium.launch).toHaveBeenCalledTimes(2);
      expect(mockChromium.launch).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ headless: true })
      );
      expect(mockChromium.launch).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ headless: false })
      );
    });
  });
});