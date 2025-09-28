import { Builder } from 'selenium-webdriver';
import { SeleniumChromeBasic, gotoBySeleniumBasic } from '../../src/selenium-chrome-basic';

// Mock selenium-webdriver
jest.mock('selenium-webdriver');
jest.mock('selenium-webdriver/chrome.js', () => ({
  __esModule: true,
  default: {
    Options: jest.fn().mockImplementation(() => ({
      addArguments: jest.fn(),
    })),
  },
}));

const mockBuilder = Builder as jest.MockedClass<typeof Builder>;

describe('Selenium Chrome Basic Module', () => {
  let mockDriver: any;
  let mockWebDriverBuilder: any;
  let mockChromeOptions: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock driver
    mockDriver = {
      get: jest.fn(),
      quit: jest.fn(),
      getPageSource: jest.fn(),
      getTitle: jest.fn(),
    };

    // Mock Chrome options
    mockChromeOptions = {
      addArguments: jest.fn(),
    };

    // Mock WebDriver builder
    mockWebDriverBuilder = {
      forBrowser: jest.fn().mockReturnThis(),
      setChromeOptions: jest.fn().mockReturnThis(),
      build: jest.fn().mockResolvedValue(mockDriver),
    };

    mockBuilder.mockImplementation(() => mockWebDriverBuilder);

    // Mock chrome.Options constructor
    const chromeModule = require('selenium-webdriver/chrome.js');
    chromeModule.default.Options.mockImplementation(() => mockChromeOptions);
  });

  describe('SeleniumChromeBasic', () => {
    it('should create instance successfully', () => {
      const chrome = new SeleniumChromeBasic();
      expect(chrome).toBeInstanceOf(SeleniumChromeBasic);
    });

    it('should initialize with default options', async () => {
      const chrome = new SeleniumChromeBasic();

      await chrome.initialize({ headless: false });

      expect(mockBuilder).toHaveBeenCalled();
      expect(mockWebDriverBuilder.forBrowser).toHaveBeenCalledWith('chrome');
      expect(mockWebDriverBuilder.setChromeOptions).toHaveBeenCalledWith(mockChromeOptions);
      expect(mockWebDriverBuilder.build).toHaveBeenCalled();
      expect(chrome.driver).toBe(mockDriver);
    });

    it('should initialize with headless mode', async () => {
      const chrome = new SeleniumChromeBasic();

      await chrome.initialize({ headless: true });

      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--headless=new');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-gpu');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--no-sandbox');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-dev-shm-usage');
    });

    it('should initialize with custom arguments', async () => {
      const chrome = new SeleniumChromeBasic();
      const customArgs = ['--disable-web-security', '--allow-running-insecure-content'];

      await chrome.initialize({
        headless: false,
        arguments: customArgs
      });

      // Check that default arguments are added
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-gpu');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--no-sandbox');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-dev-shm-usage');

      // Check that custom arguments are added
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-web-security');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--allow-running-insecure-content');
    });

    it('should navigate to URL', async () => {
      const chrome = new SeleniumChromeBasic();
      await chrome.initialize({ headless: true });

      await chrome.goto('https://example.com');

      expect(mockDriver.get).toHaveBeenCalledWith('https://example.com');
    });

    it('should close driver', async () => {
      const chrome = new SeleniumChromeBasic();
      await chrome.initialize({ headless: true });

      await chrome.close();

      expect(mockDriver.quit).toHaveBeenCalled();
    });

    it('should handle initialization without options', async () => {
      const chrome = new SeleniumChromeBasic();

      await chrome.initialize({});

      expect(mockBuilder).toHaveBeenCalled();
      expect(mockWebDriverBuilder.build).toHaveBeenCalled();
    });

    it('should handle initialization with empty custom arguments', async () => {
      const chrome = new SeleniumChromeBasic();

      await chrome.initialize({
        headless: false,
        arguments: []
      });

      // Should still add default arguments
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-gpu');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--no-sandbox');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-dev-shm-usage');
    });

    it('should combine default and custom arguments correctly', async () => {
      const chrome = new SeleniumChromeBasic();
      const customArgs = ['--custom-arg1', '--custom-arg2'];

      await chrome.initialize({
        headless: true,
        arguments: customArgs
      });

      // Should have all arguments: headless + default + custom
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--headless=new');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-gpu');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--no-sandbox');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-dev-shm-usage');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--custom-arg1');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--custom-arg2');
    });
  });

  describe('gotoBySeleniumBasic', () => {
    it('should create chrome instance and navigate to URL', async () => {
      const result = await gotoBySeleniumBasic('https://example.com');

      expect(mockBuilder).toHaveBeenCalled();
      expect(mockWebDriverBuilder.forBrowser).toHaveBeenCalledWith('chrome');
      expect(mockWebDriverBuilder.setChromeOptions).toHaveBeenCalled();
      expect(mockWebDriverBuilder.build).toHaveBeenCalled();
      expect(mockDriver.get).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(mockDriver);
    });

    it('should initialize with non-headless mode by default', async () => {
      await gotoBySeleniumBasic('https://test.com');

      // Should not add headless argument
      expect(mockChromeOptions.addArguments).not.toHaveBeenCalledWith('--headless=new');

      // But should add default arguments
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-gpu');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--no-sandbox');
      expect(mockChromeOptions.addArguments).toHaveBeenCalledWith('--disable-dev-shm-usage');
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

        const result = await gotoBySeleniumBasic(url);

        expect(mockDriver.get).toHaveBeenCalledWith(url);
        expect(result).toBe(mockDriver);
      }
    });

    it('should handle errors during initialization', async () => {
      const error = new Error('Failed to start browser');
      mockWebDriverBuilder.build.mockRejectedValueOnce(error);

      await expect(gotoBySeleniumBasic('https://example.com')).rejects.toThrow('Failed to start browser');
    });

    it('should handle errors during navigation', async () => {
      const error = new Error('Navigation failed');
      mockDriver.get.mockRejectedValueOnce(error);

      await expect(gotoBySeleniumBasic('https://invalid-url')).rejects.toThrow('Navigation failed');
    });

    it('should return the driver instance', async () => {
      const result = await gotoBySeleniumBasic('https://example.com');

      expect(result).toBe(mockDriver);
      expect(typeof result.get).toBe('function');
      expect(typeof result.quit).toBe('function');
    });
  });

  describe('Integration scenarios', () => {
    it('should allow using the driver returned by gotoBySeleniumBasic', async () => {
      const driver = await gotoBySeleniumBasic('https://example.com');

      // Mock some driver methods for testing
      (driver.getPageSource as jest.Mock).mockResolvedValue('<html><body>Test</body></html>');
      (driver.getTitle as jest.Mock).mockResolvedValue('Test Page');

      const pageSource = await driver.getPageSource();
      const title = await driver.getTitle();

      expect(pageSource).toBe('<html><body>Test</body></html>');
      expect(title).toBe('Test Page');

      await driver.quit();
      expect(mockDriver.quit).toHaveBeenCalled();
    });

    it('should work with SeleniumChromeBasic class directly', async () => {
      const chrome = new SeleniumChromeBasic();

      await chrome.initialize({ headless: true });
      await chrome.goto('https://test.com');

      expect(mockDriver.get).toHaveBeenCalledWith('https://test.com');

      await chrome.close();
      expect(mockDriver.quit).toHaveBeenCalled();
    });
  });
});