import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, execSync } from 'child_process';

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

// 프로필 찾기 (주계정으로 등록된 프로필 우선)
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
    let foundProfiles: { folder: string; isPrimary: boolean }[] = [];
    
    for (const folder of folders) {
      try {
        const json = loadJson(`${folder}/Preferences`);
        if (json.account_info && json.account_info.length > 0) {
          // 모든 계정을 확인
          for (let i = 0; i < json.account_info.length; i++) {
            const account = json.account_info[i];
            if (account.email === email) {
              foundProfiles.push({
                folder: folder.replace(/\\/g, '/').split('/').pop() || '',
                isPrimary: i === 0  // 첫 번째 계정이면 주계정
              });
              break;
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // 주계정으로 등록된 프로필을 우선 반환
    const primaryProfile = foundProfiles.find(p => p.isPrimary);
    if (primaryProfile) {
      console.log(`✅ 주계정으로 등록된 프로필 발견: ${primaryProfile.folder}`);
      return primaryProfile.folder;
    }
    
    // 주계정이 없으면 첫 번째로 발견된 프로필 반환
    if (foundProfiles.length > 0) {
      console.log(`⚠️ 보조계정으로만 등록됨. 첫 번째 프로필 사용: ${foundProfiles[0].folder}`);
      return foundProfiles[0].folder;
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
  private chromeProcess?: any;

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
    // 이메일로 프로필 찾기 (기존 로직 유지)
    const profileName = options.profileName ?? getPlaywrightChromeProfileByEmail(options.email, options.userDataDir) ?? null;

    if (!profileName) {
      throw new Error(`Profile not found for email: ${options.email}`);
    }

    // Chrome 프로세스 종료
    try {
      execSync('pkill -f "Google Chrome"', { stdio: 'ignore' });
      console.log('🔄 기존 Chrome 프로세스 종료');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // 프로세스가 없으면 무시
    }

    // 프로필 경로 설정
    const baseUserDataDir = options.userDataDir || process.env.CHROMIUM_USERDATA_PATH || '/Users/youchan/Library/Application Support/Google/Chrome';
    const chromeProfilePath = path.join(baseUserDataDir, profileName);
    
    if (!fs.existsSync(chromeProfilePath)) {
      throw new Error(`Chrome 프로필을 찾을 수 없습니다: ${chromeProfilePath}`);
    }

    console.log(`📁 Chrome 프로필: ${chromeProfilePath}`);

    // Chrome을 디버깅 모드로 실행
    const chromeArgs = [
      '--remote-debugging-port=9222',
      `--user-data-dir=${baseUserDataDir}`,
      `--profile-directory=${profileName}`,
      '--no-first-run',
      '--disable-default-apps',
      '--start-maximized',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor',
      ...options.arguments || []
    ];

    console.log('🌐 Chrome 실행 중...');
    this.chromeProcess = spawn(CHROMIUM_EXECUTABLE_PATH!, chromeArgs, {
      detached: true,
      stdio: 'ignore'
    });

    // Chrome이 완전히 시작될 때까지 대기
    console.log('⏳ Chrome 시작 대기 중... (5초)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Playwright로 실행 중인 Chrome에 연결
    console.log('🔗 Playwright로 Chrome에 연결 중...');
    this.browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // 기본 컨텍스트 가져오기
    const contexts = this.browser.contexts();
    this.context = contexts.length > 0 ? contexts[0] : await this.browser.newContext();

    // 페이지 가져오기 또는 생성
    const pages = await this.context.pages();
    if (pages.length > 0) {
      this.page = pages[0];
    } else {
      this.page = await this.context.newPage();
    }

    console.log('✅ Chrome 연결 완료');
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
    
    // Playwright 연결 종료
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Playwright 연결 종료');
    }

    // Chrome 프로세스 종료
    if (this.chromeProcess) {
      try {
        process.kill(-this.chromeProcess.pid);
        console.log('✅ Chrome 프로세스 종료');
      } catch (error) {
        console.log('ℹ️ Chrome 프로세스 종료 실패 (이미 종료되었을 수 있음)');
      }
    }
  }
}

export { PlaywrightChromeProfile, getPlaywrightChromeProfileByEmail };