import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

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

// 프로필 데이터를 임시 디렉토리로 복사하는 함수
const copyProfileData = (sourceProfile: string, tempProfileDir: string, userDataDir: string): boolean => {
  console.log('📋 프로필 데이터를 복사합니다...');
  
  const sourcePath = path.join(userDataDir, sourceProfile);
  const tempPath = tempProfileDir;
  
  // 임시 디렉토리 생성
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  
  // 필수 파일들 복사
  const essentialFiles = [
    'Cookies',
    'Login Data',
    'Preferences',
    'Secure Preferences',
    'Web Data',
    'History',
    'Bookmarks'
  ];
  
  const essentialDirs = [
    'Local Storage',
    'Session Storage',
    'IndexedDB',
    'databases'
  ];
  
  let copiedFiles = 0;
  
  // 파일 복사
  for (const fileName of essentialFiles) {
    const sourceFile = path.join(sourcePath, fileName);
    const destFile = path.join(tempPath, fileName);
    
    if (fs.existsSync(sourceFile)) {
      try {
        fs.copyFileSync(sourceFile, destFile);
        copiedFiles++;
        console.log(`   ✅ ${fileName} 복사됨`);
      } catch (error) {
        console.log(`   ⚠️  ${fileName} 복사 실패: ${(error as Error).message}`);
      }
    }
  }
  
  // 디렉토리 복사
  for (const dirName of essentialDirs) {
    const sourceDir = path.join(sourcePath, dirName);
    const destDir = path.join(tempPath, dirName);
    
    if (fs.existsSync(sourceDir)) {
      try {
        fs.cpSync(sourceDir, destDir, { recursive: true, force: true });
        copiedFiles++;
        console.log(`   ✅ ${dirName}/ 복사됨`);
      } catch (error) {
        console.log(`   ⚠️  ${dirName}/ 복사 실패: ${(error as Error).message}`);
      }
    }
  }
  
  console.log(`   📊 총 ${copiedFiles}개 항목이 복사되었습니다.`);
  return copiedFiles > 0;
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
  private tempUserDataDir?: string;

  constructor(
    options: {
      headless?: boolean;
      profileName?: string;
      email?: string;
      userDataDir?: string;
      arguments?: string[];
      useTempProfile?: boolean;
    } = { headless: false, profileName: '', email: '', userDataDir: '', arguments: [], useTempProfile: false }
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
    useTempProfile?: boolean;
  }) {
    console.log('🎭 Playwright persistent context 방식으로 Chrome 실행 (CDP 없음)');
    
    // 이메일로 프로필 찾기
    const profileName = options.profileName ?? getPlaywrightChromeProfileByEmail(options.email, options.userDataDir) ?? null;

    if (!profileName) {
      throw new Error(`Profile not found for email: ${options.email}`);
    }

    // 기존 Chrome 프로세스 종료 (간단한 방법)
    try {
      execSync('pkill -TERM -f "Google Chrome"', { stdio: 'ignore' });
      console.log('🔄 기존 Chrome 프로세스 종료');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // 무시
    }

    // 프로필 경로 설정
    const baseUserDataDir = options.userDataDir || process.env.CHROMIUM_USERDATA_PATH || '/Users/youchan/Library/Application Support/Google/Chrome';
    const originalProfilePath = path.join(baseUserDataDir, profileName);
    
    if (!fs.existsSync(originalProfilePath)) {
      throw new Error(`Chrome 프로필을 찾을 수 없습니다: ${originalProfilePath}`);
    }

    console.log(`📁 원본 Chrome 프로필: ${originalProfilePath}`);

    const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
    // Chrome 실행 파일 존재 확인
    if (!fs.existsSync(chromeExecutable)) {
      throw new Error(`Chrome 실행 파일을 찾을 수 없습니다: ${chromeExecutable}`);
    }
    
    console.log(`🔧 Chrome 실행 파일: ${chromeExecutable}`);
    
    let actualUserDataDir = baseUserDataDir;
    let actualProfileName = profileName;
    
    // 임시 프로필 사용 옵션이 활성화된 경우
    if (options.useTempProfile) {
      // 임시 사용자 데이터 디렉토리 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.tempUserDataDir = path.join(os.tmpdir(), `chrome-profile-${timestamp}`);
      const tempProfilePath = path.join(this.tempUserDataDir, 'Default');
      
      console.log(`🔧 임시 프로필 디렉토리: ${this.tempUserDataDir}`);
      
      // 프로필 데이터 복사
      const copySuccess = copyProfileData(profileName, tempProfilePath, baseUserDataDir);
      if (!copySuccess) {
        console.log('⚠️  프로필 데이터 복사에 실패했습니다. 빈 프로필로 진행합니다.');
      }
      
      actualUserDataDir = this.tempUserDataDir;
      actualProfileName = 'Default';
    }
    
    console.log(`🔧 사용할 프로필 경로: ${path.join(actualUserDataDir, actualProfileName)}`);
    
    // Playwright persistent context로 Chrome 실행 (CDP 없음)
    // 주의: launchPersistentContext는 user-data-dir을 사용하고 profile-directory는 args로
    this.context = await chromium.launchPersistentContext(actualUserDataDir, {
      headless: options.headless ?? false,
      executablePath: chromeExecutable,
      args: [
        `--profile-directory=${actualProfileName}`, // 특정 프로필 사용
        '--no-first-run',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--start-maximized',
        ...options.arguments || []
      ]
    });

    // Browser 객체는 context에서 가져오기
    this.browser = this.context.browser()!;
    
    // 페이지 가져오기 또는 생성
    const pages = this.context.pages();
    if (pages.length > 0) {
      this.page = pages[0];
    } else {
      this.page = await this.context.newPage();
    }

    console.log('✅ Playwright persistent context 연결 완료 (CDP 없음)');
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
    
    // Playwright persistent context 종료 (Chrome도 함께 종료됨)
    if (this.context) {
      await this.context.close();
      console.log('✅ Playwright persistent context 종료');
    }
    
    // 임시 프로필 디렉토리 정리
    if (this.tempUserDataDir && fs.existsSync(this.tempUserDataDir)) {
      try {
        fs.rmSync(this.tempUserDataDir, { recursive: true, force: true });
        console.log(`🗑️  임시 프로필 디렉토리 정리됨: ${this.tempUserDataDir}`);
      } catch (error) {
        console.log(`⚠️  임시 디렉토리 정리 실패: ${(error as Error).message}`);
      }
    }
  }
}

export { PlaywrightChromeProfile, getPlaywrightChromeProfileByEmail, copyProfileData };