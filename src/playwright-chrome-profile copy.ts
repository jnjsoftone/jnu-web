import { chromium, Browser, BrowserContext, Page, Locator } from 'playwright';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, execSync } from 'child_process';
import * as net from 'net';
import * as http from 'http';

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
    console.log(`🔧 프로필 찾기 - 사용할 userDataDir: ${userDataDir}`);
    console.log(`🔧 환경변수 CHROMIUM_USERDATA_PATH: ${process.env.CHROMIUM_USERDATA_PATH}`);
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

  // 사용 가능한 포트 찾기 (개선된 버전)
  private async findAvailablePort(startPort: number): Promise<number> {
    const maxAttempts = 20; // 최대 20개 포트 시도
    
    // 먼저 현재 사용 중인 Chrome 디버깅 포트들을 확인 (macOS 기준)
    try {
      // Chrome 디버깅 포트 확인
      const chromeDebugPorts = execSync(`ps aux | grep "remote-debugging-port" | grep -v grep`, { encoding: 'utf8', stdio: 'pipe' });
      if (chromeDebugPorts.trim()) {
        console.log(`🔍 디버깅 포트로 실행된 Chrome:\n${chromeDebugPorts.trim()}`);
      }
      
      // 포트 사용 현황 확인
      const portsInUse = execSync(`lsof -i :${startPort}-${startPort + maxAttempts - 1} 2>/dev/null | grep LISTEN || true`, { encoding: 'utf8', stdio: 'pipe' });
      if (portsInUse.trim()) {
        console.log(`🔍 현재 사용 중인 포트들:\n${portsInUse.trim()}`);
      } else {
        console.log(`🔍 포트 ${startPort}-${startPort + maxAttempts - 1} 범위: 모두 사용 가능`);
      }
    } catch (e) {
      // lsof 실패시 무시 (포트가 사용 중이지 않을 수 있음)
      console.log(`🔍 포트 확인 중 오류 (무시): ${(e as Error).message}`);
    }
    
    for (let port = startPort; port < startPort + maxAttempts; port++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const server = net.createServer();
          server.listen(port, () => {
            server.close(() => resolve());
          });
          server.on('error', reject);
        });
        
        console.log(`🔍 사용 가능한 포트 발견: ${port}`);
        return port;
      } catch (error) {
        console.log(`⚠️ 포트 ${port} 사용 중, 다음 포트 시도...`);
        continue;
      }
    }
    
    throw new Error(`${startPort}-${startPort + maxAttempts - 1} 범위에서 사용 가능한 포트를 찾을 수 없습니다`);
  }

  // 포트가 열릴 때까지 대기 (HTTP 엔드포인트 체크 포함)
  private async waitForPort(port: number, timeout: number): Promise<void> {
    const startTime = Date.now();
    let attempts = 0;
    
    console.log(`🔍 Chrome 포트 ${port} 연결 대기 중...`);
    
    while (Date.now() - startTime < timeout) {
      attempts++;
      try {
        // 1. TCP 포트 연결 체크
        await new Promise<void>((resolve, reject) => {
          const socket = net.createConnection(port, 'localhost');
          const timer = setTimeout(() => {
            socket.destroy();
            reject(new Error('TCP connection timeout'));
          }, 2000);
          
          socket.on('connect', () => {
            clearTimeout(timer);
            socket.destroy();
            resolve();
          });
          socket.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
          });
        });

        // 2. HTTP 엔드포인트 체크 (Chrome DevTools API)
        await new Promise<void>((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost',
            port: port,
            path: '/json/version',
            method: 'GET',
            timeout: 2000
          }, (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`HTTP status ${res.statusCode}`));
            }
          });
          
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('HTTP request timeout'));
          });
          req.end();
        });

        console.log(`✅ Chrome 디버깅 포트 ${port} 준비 완료 (시도 ${attempts}회)`);
        return;
      } catch (error) {
        if (attempts % 3 === 0) {
          console.log(`🔄 포트 ${port} 연결 시도 중... (${attempts}회째, ${Math.round((Date.now() - startTime) / 1000)}초 경과)`);
          console.log(`   TCP/HTTP 체크 실패: ${(error as Error).message}`);
        }
        // 2초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.error(`❌ Chrome 포트 ${port} 연결 실패 (총 ${attempts}회 시도, ${timeout/1000}초 대기)`);
    throw new Error(`Timeout waiting for Chrome debugging port ${port} after ${attempts} attempts`);
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

    // 프로필 경로 설정
    const baseUserDataDir = options.userDataDir || process.env.CHROMIUM_USERDATA_PATH || '/Users/youchan/Library/Application Support/Google/Chrome';
    const chromeProfilePath = path.join(baseUserDataDir, profileName);
    
    if (!fs.existsSync(chromeProfilePath)) {
      throw new Error(`Chrome 프로필을 찾을 수 없습니다: ${chromeProfilePath}`);
    }

    console.log(`📁 Chrome 프로필: ${chromeProfilePath}`);

    // CDP 방식 실패시 Playwright persistent context 사용
    try {
      await this.initializeWithCDP(options, profileName, baseUserDataDir, chromeProfilePath);
    } catch (error) {
      console.log('⚠️ CDP 연결 실패, Playwright persistent context 방식으로 전환');
      await this.initializeWithPersistentContext(options, chromeProfilePath);
    }
  }

  // CDP 방식으로 Chrome 초기화
  private async initializeWithCDP(options: any, profileName: string, baseUserDataDir: string, chromeProfilePath: string) {
    console.log('🔗 CDP 연결 방식으로 시도 중...');
    
    // Chrome 프로세스 완전 종료 (더 강력한 방법)
    try {
      console.log('🔄 기존 Chrome 프로세스 강제 종료 중...');
      
      // 1. 일반적인 Chrome 프로세스 종료
      try {
        execSync('pkill -TERM -f "Google Chrome"', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // 무시 - 프로세스가 없을 수 있음
      }
      
      // 2. 강제 종료
      try {
        execSync('pkill -9 -f "Google Chrome"', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // 무시 - 프로세스가 없을 수 있음
      }
      
      // 3. 디버깅 포트를 사용하는 프로세스 종료
      try {
        const startPort = 9222;
        const endPort = 9230;
        for (let port = startPort; port <= endPort; port++) {
          try {
            execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
          } catch (e) {
            // 포트에 프로세스가 없으면 무시
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // 무시
      }
      
      // 4. 프로세스 완전 종료 확인
      let chromeStillRunning = false;
      try {
        const result = execSync('pgrep -f "Google Chrome"', { encoding: 'utf8' });
        if (result.trim()) {
          chromeStillRunning = true;
          console.log('⚠️ Chrome 프로세스가 아직 실행 중입니다. 추가 대기...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        console.log('✅ Chrome 프로세스 완전 종료 확인');
      }
      
      if (chromeStillRunning) {
        console.log('⚠️ Chrome 프로세스가 여전히 실행 중일 수 있습니다. 계속 진행...');
      }
    } catch (error) {
      console.log('ℹ️ Chrome 프로세스 종료 완료');
    }

    // 사용 가능한 포트 찾기 (9222부터 시작, Cursor가 사용하는 포트 피하기)
    const debugPort = await this.findAvailablePort(9222);
    
    // Chrome을 디버깅 모드로 실행 (CDP 연결 최적화)
    const chromeArgs = [
      `--remote-debugging-port=${debugPort}`,
      '--remote-debugging-address=0.0.0.0',  // 모든 인터페이스에서 접근 허용
      `--user-data-dir=${baseUserDataDir}`,
      `--profile-directory=${profileName}`,
      '--no-first-run',
      '--disable-default-apps',
      '--start-maximized',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor,TranslateUI,Translate',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-extensions',
      '--enable-automation',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--allow-origins=*',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-component-extensions',
      '--disable-domain-reliability',
      '--no-default-browser-check',
      '--no-pings',
      ...(options.headless ? ['--headless=new'] : []),  // headless 옵션이 true일 때만 적용
      ...options.arguments || []
    ];

    // 실제 Google Chrome 사용 (환경변수 무시)
    const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
    // Chrome 실행 파일 존재 확인
    if (!fs.existsSync(chromeExecutable)) {
      throw new Error(`Chrome 실행 파일을 찾을 수 없습니다: ${chromeExecutable}`);
    }
    
    console.log(`🌐 Chrome 실행 중... (포트: ${debugPort})`);
    console.log(`🔧 Chrome 경로: ${chromeExecutable}`);
    console.log(`📁 프로필 경로: ${chromeProfilePath}`);
    console.log(`🔧 Chrome 인수:`, chromeArgs.slice(0, 5).join(' '), '...');
    
    // Chrome 프로세스 시작
    this.chromeProcess = spawn(chromeExecutable, chromeArgs, {
      detached: false,  // 프로세스 그룹 제어를 위해 false로 변경
      stdio: ['ignore', 'pipe', 'pipe']  // stdout/stderr 캡처
    });

    // Chrome 프로세스 오류 처리
    let chromeStarted = false;
    this.chromeProcess.on('error', (error: Error) => {
      console.error('❌ Chrome 프로세스 시작 실패:', error);
      throw error;
    });

    this.chromeProcess.on('exit', (code: number | null, signal: string | null) => {
      if (!chromeStarted) {
        console.error(`❌ Chrome 프로세스가 예기치 않게 종료됨 (코드: ${code}, 시그널: ${signal})`);
      }
    });

    // Chrome stderr 출력 모니터링 (디버깅용)
    if (this.chromeProcess.stderr) {
      this.chromeProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('DevTools listening')) {
          console.log(`🔍 Chrome DevTools: ${output.trim()}`);
        }
      });
    }

    // Chrome이 시작될 때까지 대기 (더 오래 기다리기)
    console.log('⏳ Chrome 시작 대기 중... (10초)');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Chrome 디버깅 포트가 열릴 때까지 대기 (60초로 연장)
    await this.waitForPort(debugPort, 60000);
    chromeStarted = true;

    // Chrome DevTools API 엔드포인트 확인
    try {
      console.log(`🔍 Chrome DevTools API 확인 중... (http://localhost:${debugPort}/json)`);
      const response = await new Promise<string>((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: debugPort,
          path: '/json',
          method: 'GET',
          timeout: 5000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        req.end();
      });
      
      const tabs = JSON.parse(response);
      console.log(`📱 Chrome 탭 수: ${tabs.length}`);
      if (tabs.length > 0) {
        console.log(`🔗 첫 번째 탭: ${tabs[0].title || 'No title'}`);
      }
    } catch (error) {
      console.log(`⚠️ Chrome DevTools API 확인 실패: ${(error as Error).message}`);
    }

    // Playwright로 실행 중인 Chrome에 연결
    console.log(`🔗 Playwright로 Chrome에 연결 중... (http://localhost:${debugPort})`);
    this.browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`);
    
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

  // Playwright persistent context 방식으로 Chrome 초기화 (fallback)
  private async initializeWithPersistentContext(options: any, chromeProfilePath: string) {
    console.log('🎭 Playwright persistent context 방식으로 시도 중...');
    
    // Chrome 프로세스 종료 (간단한 방법)
    try {
      execSync('pkill -TERM -f "Google Chrome"', { stdio: 'ignore' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // 무시
    }

    const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
    // Playwright persistent context로 Chrome 실행
    this.context = await chromium.launchPersistentContext(chromeProfilePath, {
      headless: options.headless ?? false,
      executablePath: chromeExecutable,
      args: [
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

    console.log('✅ Playwright persistent context 연결 완료');
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