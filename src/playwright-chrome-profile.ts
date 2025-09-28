import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import * as fs from 'fs';
import * as path from 'path';

const CHROMIUM_EXECUTABLE_PATH = process.env.CHROMIUM_EXECUTABLE_PATH

// Safe folder finding function that handles broken symlinks
const findProfileFolders = (basePath: string): string[] => {
  const matchedFolders: string[] = [];
  try {
    for (const entry of fs.readdirSync(basePath)) {
      if (entry.startsWith('Profile')) {
        const fullPath = path.join(basePath, entry);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            matchedFolders.push(fullPath.replace(/\\/g, '/'));
          }
        } catch (error) {
          // Skip broken symlinks or inaccessible entries
          continue;
        }
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${basePath}: ${(error as Error).message}`);
  }
  return matchedFolders;
};

// 프로필 찾기
const getPlaywrightChromeProfileByEmail = (email = '', userDataDir = '') => {
  // userDataDir가 비어있으면 CHROMIUM_USERDATA_PATH 사용
  if (!userDataDir) {
    userDataDir = process.env.CHROMIUM_USERDATA_PATH || '/root/.config/google-chrome';
  }

  // email이 비어있으면 Default 프로필 경로 반환
  if (!email) {
    return 'Default';
  }
  try {
    const folders = findProfileFolders(userDataDir);
    for (const folder of folders) {
      try {
        const json = loadJson(`${folder}/Preferences`);
        if (json.account_info && json.account_info.length > 0) {
          // 모든 계정을 확인 (여러 계정이 있을 수 있음)
          for (const account of json.account_info) {
            if (account.email === email) {
              return folder.replace(/\\/g, '/').split('/').pop() || null;
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.warn(`Error finding Chrome profiles: ${(error as Error).message}`);
  }
  return null;
};

interface WaitOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

class PlaywrightChromeProfile {
  public browser!: Browser;
  public context!: BrowserContext;
  public page!: Page;
  private initPromise: Promise<void>;

  constructor(
    options: {
      headless?: boolean;
      profileName?: string;
      email?: string;
      userDataDir?: string;
      arguments?: string[];
    } = { headless: false, profileName: '', email: '', userDataDir: '', arguments: [] }
  ) {
    this.initPromise = this.initializeBrowser(options);
  }

  // Ensure browser is initialized before any operation
  private async ensureInitialized() {
    await this.initPromise;
  }

  private async initializeBrowser(options: {
    headless?: boolean;
    profileName?: string;
    email?: string;
    userDataDir?: string;
    arguments?: string[];
  }) {
    const profileName = options.profileName ?? getPlaywrightChromeProfileByEmail(options.email, options.userDataDir) ?? null;

    // 컨테이너 환경 감지 (Docker, CI, etc.)
    const isContainerEnv = process.env.DOCKER_CONTAINER ||
      process.env.CI ||
      fs.existsSync('/.dockerenv') ||
      process.getuid?.() === 0; // Running as root

    // 프로필 강제 사용 환경변수 확인
    const forceProfile = process.env.FORCE_CHROME_PROFILE === 'true';

    // 자동화 감지 우회를 위한 기본 인자
    const defaultArguments = [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-extensions',
      '--start-maximized',
      '--window-size=1920,1080',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-popup-blocking',
      '--disable-notifications',
      '--disable-infobars',
      '--ignore-certificate-errors',
      '--disable-setuid-sandbox',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-default-apps',
      '--disable-sync',
      '--single-process', // For container environments
      '--no-zygote', // For container environments
      '--remote-debugging-port=0', // Let Chrome choose a random port
      '--font-render-hinting=none', // Better font rendering
      '--enable-font-antialiasing', // Enable font antialiasing
      '--force-device-scale-factor=1', // Consistent scaling
      '--lang=ko-KR', // Set Korean locale
      '--accept-lang=ko-KR,ko,en-US,en', // Language preferences
    ];

    // 기본 인자와 사용자 지정 인자를 합치기
    const finalArguments = [...defaultArguments, ...(options.arguments || [])];

    // 프로필 사용 여부에 따라 다른 초기화 방법 사용
    if (profileName && profileName !== 'null' && profileName !== 'undefined' && (!isContainerEnv || forceProfile)) {
      if (isContainerEnv && forceProfile) {
        console.log('✅ Profile settings forced in container environment');
      }

      // 프로필이 있는 경우 launchPersistentContext 사용
      const baseUserDataDir = options.userDataDir || process.env.CHROMIUM_USERDATA_PATH || '/root/.config/google-chrome';
      const userDataDir = path.join(baseUserDataDir, profileName);

      this.context = await chromium.launchPersistentContext(userDataDir, {
        headless: options.headless || false,
        executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
        args: finalArguments,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        permissions: ['notifications'],
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko,en-US,en'
        }
      });

      // launchPersistentContext에서는 browser 객체가 없음
      this.browser = this.context.browser()!;
      this.page = this.context.pages()[0] || await this.context.newPage();
    } else {
      if (profileName && isContainerEnv && !forceProfile) {
        console.warn('Profile settings skipped in container environment for stability (set FORCE_CHROME_PROFILE=true to override)');
      }

      // 프로필이 없는 경우 일반 launch 사용
      const launchOptions: any = {
        headless: options.headless || false,
        args: finalArguments,
      };

      // Chromium 실행 경로 설정
      if (process.env.CHROMIUM_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
      }

      this.browser = await chromium.launch(launchOptions);

      // 컨텍스트 생성 with user agent
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        permissions: ['notifications'],
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko,en-US,en'
        }
      });

      // 페이지 생성
      this.page = await this.context.newPage();
    }

    // 자동화 감지 우회 스크립트 실행
    await this.page.addInitScript(() => {
      // navigator.webdriver 속성 제거
      Object.defineProperty((globalThis as any).navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome 자동화 관련 속성 제거
      delete (globalThis as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (globalThis as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (globalThis as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
  }

  async getFullSize() {
    await this.ensureInitialized();
    let lastHeight = 0;
    const scrollStep = 800; // 한 번에 스크롤할 픽셀 수
    let noChangeCount = 0; // 높이 변화 없음 카운터
    const maxNoChange = 3; // 최대 높이 변화 없음 횟수

    while (true) {
      // 현재 viewport 높이와 전체 문서 높이 가져오기
      const dimensions = await this.page.evaluate(() => {
        const win = globalThis as any;
        const doc = win.document;
        return {
          viewportHeight: win.innerHeight,
          documentHeight: Math.max(
            doc.documentElement.scrollHeight,
            doc.body.scrollHeight,
            doc.documentElement.offsetHeight,
            doc.body.offsetHeight
          ),
          scrollY: win.scrollY || win.pageYOffset
        };
      });

      const { viewportHeight, documentHeight, scrollY } = dimensions;

      // 현재 높이가 이전과 같은 경우
      if (documentHeight === lastHeight) {
        noChangeCount++;
        // 여러 번 연속으로 높이 변화가 없으면 스크롤 종료
        if (noChangeCount >= maxNoChange) {
          break;
        }
      } else {
        // 높이가 변했으면 카운터 리셋
        noChangeCount = 0;
        lastHeight = documentHeight;
      }

      // 다음 스크롤 위치 계산 (현재 위치 + scrollStep, 최대 문서 높이 제한)
      const nextScroll = Math.min(scrollY + scrollStep, documentHeight - viewportHeight);

      // 현재 위치가 이미 문서 끝이면 종료
      if (scrollY >= documentHeight - viewportHeight) {
        break;
      }

      // 스크롤 실행
      await this.page.evaluate((scroll) => {
        (globalThis as any).scrollTo(0, scroll);
      }, nextScroll);

      // 스크롤 후 대기 (동적 컨텐츠 로딩을 위한 시간)
      await this.page.waitForTimeout(2000);

      // 추가 컨텐츠 로딩 대기
      try {
        await this.page.waitForFunction(
          (expectedHeight) => {
            const doc = (globalThis as any).document;
            const newHeight = Math.max(
              doc.documentElement.scrollHeight,
              doc.body.scrollHeight,
              doc.documentElement.offsetHeight,
              doc.body.offsetHeight
            );
            return newHeight >= expectedHeight;
          },
          documentHeight,
          { timeout: 3000 }
        );
      } catch (error) {
        // 타임아웃 무시
      }
    }

    // 마지막으로 전체 크기 확인
    const finalDimensions = await this.page.evaluate(() => {
      const doc = (globalThis as any).document;
      return {
        width: Math.max(
          doc.documentElement.scrollWidth,
          doc.body.scrollWidth,
          doc.documentElement.offsetWidth,
          doc.body.offsetWidth
        ),
        height: Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
          doc.documentElement.offsetHeight,
          doc.body.offsetHeight
        )
      };
    });

    return finalDimensions;
  }

  async _getFullScreenshot() {
    try {
      // 페이지 전체 크기 가져오기
      const { width, height } = await this.getFullSize();

      // 창 크기 설정
      await this.page.setViewportSize({ width, height });

      // 스크린샷 데이터 반환 (base64)
      return await this.page.screenshot({ fullPage: true, type: 'png' });
    } catch (error) {
      console.error('스크린샷 촬영 중 오류 발생:', error);
      throw error;
    }
  }

  async getFullScreenshot() {
    try {
      const screenshot = await this._getFullScreenshot();
      return screenshot.toString('base64');
    } finally {
      await this.close();
    }
  }

  async saveScreenshot(path: string) {
    try {
      const screenshot = await this._getFullScreenshot();
      saveFile(path, screenshot.toString('base64'), { encoding: 'base64' });
    } finally {
      await this.close();
    }
  }

  async goto(url: string) {
    await this.ensureInitialized();
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async wait(selector: string, options: WaitOptions = {}) {
    await this.ensureInitialized();
    const { timeout = 10000, state = 'attached' } = options;

    return this.page.waitForSelector(selector, { timeout, state });
  }

  // 요소 찾기
  async findElements(selector: string): Promise<Locator> {
    await this.ensureInitialized();
    return this.page.locator(selector);
  }

  // 요소 찾기 (단일)
  async findElement(selector: string): Promise<Locator> {
    await this.ensureInitialized();
    return this.page.locator(selector).first();
  }

  // 페이지 소스 가져오기
  async getPageSource() {
    await this.ensureInitialized();
    return await this.page.content();
  }

  // 요소의 HTML 가져오기
  async getElementHtml(selector: string) {
    const element = await this.findElement(selector);
    return await element.innerHTML();
  }

  // 요소 클릭
  async click(selector: string) {
    const element = await this.findElement(selector);
    await element.scrollIntoViewIfNeeded();
    await sleepAsync(1000);
    await element.click();
  }

  // 요소의 텍스트 가져오기
  async getText(selector: string) {
    const element = await this.findElement(selector);
    return await element.textContent();
  }

  // 요소의 속성 가져오기
  async getAttribute(selector: string, attribute: string) {
    const element = await this.findElement(selector);
    return await element.getAttribute(attribute);
  }

  // 요소에 텍스트 입력하기
  async sendKeys(selector: string, text: string) {
    const element = await this.findElement(selector);
    await element.fill(text);
  }

  // 특정 요소의 스크린샷 저장
  async saveElementScreenshot(selector: string, path: string) {
    const element = await this.findElement(selector);
    const screenshot = await element.screenshot({ type: 'png' });
    saveFile(path, screenshot.toString('base64'), { encoding: 'base64' });
  }

  async executeScript(script: string, ...args: any[]) {
    await this.ensureInitialized();
    return this.page.evaluate(script, ...args);
  }

  async scrollIntoView(selector: string) {
    const element = await this.findElement(selector);
    await element.scrollIntoViewIfNeeded();
  }

  async close() {
    await this.ensureInitialized();
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

export { PlaywrightChromeProfile, getPlaywrightChromeProfileByEmail };