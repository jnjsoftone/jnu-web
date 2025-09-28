import { chromium, Browser, BrowserContext, Page } from 'playwright';

class PlaywrightChromeBasic {
  public browser!: Browser;
  public context!: BrowserContext;
  public page!: Page;

  async initialize(options: { headless?: boolean; arguments?: string[] }) {
    // 자동화 감지 우회를 위한 기본 인자
    const defaultArguments = ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'];

    // 기본 인자와 사용자 지정 인자를 합치기
    const finalArguments = [...defaultArguments, ...(options.arguments || [])];

    // 브라우저 초기화 옵션
    const launchOptions: any = {
      headless: options.headless || false,
      args: finalArguments,
    };

    // Chromium 실행 경로 설정
    if (process.env.CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
    }

    // 브라우저 초기화
    this.browser = await chromium.launch(launchOptions);

    // 컨텍스트 생성
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    // 페이지 생성
    this.page = await this.context.newPage();
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async close() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

const gotoByPlaywrightBasic = async (url: string) => {
  const chrome = new PlaywrightChromeBasic();
  await chrome.initialize({ headless: false });
  await chrome.goto(url);
  return chrome.page;
};

export { PlaywrightChromeBasic, gotoByPlaywrightBasic };