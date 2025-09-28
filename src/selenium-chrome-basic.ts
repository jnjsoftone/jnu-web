import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

class SeleniumChromeBasic {
  public driver!: WebDriver;

  async initialize(options: { headless?: boolean; arguments?: string[] }) {
    const chromeOptions = new chrome.Options();

    // 기본 옵션 설정
    if (options.headless) {
      chromeOptions.addArguments('--headless=new');
    }

    // 자동화 감지 우회를 위한 기본 인자
    const defaultArguments = ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'];

    // 기본 인자와 사용자 지정 인자를 합치기
    const finalArguments = [...defaultArguments, ...(options.arguments || [])];

    // 최종 인자 설정
    finalArguments.forEach((arg) => chromeOptions.addArguments(arg));

    // 드라이버 초기화
    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  }

  async goto(url: string) {
    await this.driver.get(url);
  }

  async close() {
    await this.driver.quit();
  }
}

const gotoBySeleniumBasic = async (url: string) => {
  const chrome = new SeleniumChromeBasic();
  await chrome.initialize({ headless: false });
  await chrome.goto(url);
  return chrome.driver;
};

export { SeleniumChromeBasic, gotoBySeleniumBasic };
