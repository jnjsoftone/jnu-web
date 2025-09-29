import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import { until } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
const getSeleniumChromeProfileByEmail = (email = '', userDataDir = '') => {
  // userDataDir가 비어있으면 CHROMIUM_USERDATA_PATH 사용
  if (!userDataDir) {
    userDataDir = process.env.CHROMIUM_USERDATA_PATH || '/root/.config/google-chrome';
    console.log(`🔧 프로필 찾기 - 사용할 userDataDir: ${userDataDir}`);
    console.log(`🔧 환경변수 CHROMIUM_USERDATA_PATH: ${process.env.CHROMIUM_USERDATA_PATH}`);
  }

  // email이 비어있으면 null 반환 (임시 프로필 사용하기 위해)
  if (!email) {
    return null;
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

// 기존 임시 프로필 디렉토리를 찾는 함수
const findExistingTempProfile = (baseName: string): string | null => {
  try {
    const tempDir = os.tmpdir();
    const targetPath = path.join(tempDir, baseName);

    if (fs.existsSync(targetPath)) {
      const defaultProfilePath = path.join(targetPath, 'Default');
      if (fs.existsSync(defaultProfilePath)) {
        console.log(`🔍 기존 임시 프로필 발견: ${targetPath}`);
        return targetPath;
      }
    }

    return null;
  } catch (error) {
    console.log(`⚠️  기존 임시 프로필 검색 실패: ${(error as Error).message}`);
    return null;
  }
};

// 프로필 데이터를 임시 디렉토리로 복사하는 함수 (확장된 버전)
const copyProfileData = (sourceProfile: string, tempProfileDir: string, userDataDir: string): boolean => {
  console.log('📋 프로필 데이터를 복사합니다...');

  const sourcePath = path.join(userDataDir, sourceProfile);
  const tempPath = tempProfileDir;

  // 임시 디렉토리 생성
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }

  // 필수 파일들 복사 (인증 및 동기화 관련 파일 추가)
  const essentialFiles = [
    'Cookies',
    'Login Data',
    'Preferences',
    'Secure Preferences',
    'Web Data',
    'History',
    'Bookmarks',
    'Google Profile.ico',
    'First Run',
    'Local State',
    'Network Action Predictor',
    'Network Persistent State',
    'Sync Data',
    'TransportSecurity',
    'Visited Links',
    'Token Service',
    'Account Manager',
    'Login Data For Account',
    'Network',
    'Profile Avatar',
    'Client Side Phishing Model',
    'Safe Browsing',
    'Session',
    'Shortcuts',
    'Top Sites',
    'Trusted Vault',
    'User Data'
  ];

  const essentialDirs = [
    'Local Storage',
    'Session Storage',
    'IndexedDB',
    'databases',
    'Sync Data',
    'blob_storage',
    'File System',
    'Platform Notifications'
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

class SeleniumChromeProfile {
  public driver!: WebDriver;
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
    this.initPromise = this.initializeDriver(options);
  }

  // Ensure driver is initialized before any operation
  private async ensureInitialized() {
    await this.initPromise;
  }

  private async initializeDriver(options: {
    headless?: boolean;
    profileName?: string;
    email?: string;
    userDataDir?: string;
    arguments?: string[];
    useTempProfile?: boolean;
  }) {
    console.log('🔧 Selenium Chrome Profile 초기화 중...');
    
    const chromeOptions = new chrome.Options();

    // 플랫폼에 따른 Chrome 실행 파일 경로 설정
    const chromeExecutable = process.env.CHROMIUM_EXECUTABLE_PATH ||
      (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
       process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' :
       '/usr/bin/google-chrome');

    // Chrome 실행 파일 존재 확인
    if (!fs.existsSync(chromeExecutable)) {
      throw new Error(`Chrome 실행 파일을 찾을 수 없습니다: ${chromeExecutable}`);
    }

    chromeOptions.setChromeBinaryPath(chromeExecutable);
    console.log(`🔧 Chrome 실행 파일: ${chromeExecutable}`);

    // 기본 옵션 설정
    if (options.headless) {
      chromeOptions.addArguments('--headless=new');
    }

    const profileName = options.profileName ?? getSeleniumChromeProfileByEmail(options.email, options.userDataDir) ?? null;

    // 컨테이너 환경 감지 (Docker, CI, etc.)
    const isContainerEnv = process.env.DOCKER_CONTAINER ||
      process.env.CI ||
      fs.existsSync('/.dockerenv') ||
      process.getuid?.() === 0; // Running as root

    // 프로필 강제 사용 환경변수 확인
    const forceProfile = process.env.FORCE_CHROME_PROFILE === 'true';

    // 프로필 설정 로직
    if (profileName && profileName !== 'null' && profileName !== 'undefined') {
      const baseUserDataDir = options.userDataDir || process.env.CHROMIUM_USERDATA_PATH ||
        (process.platform === 'win32' ? 'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Google\\Chrome\\User Data' :
         process.platform === 'darwin' ? '/Users/' + os.userInfo().username + '/Library/Application Support/Google/Chrome' :
         '/home/' + os.userInfo().username + '/.config/google-chrome');

      let actualUserDataDir = baseUserDataDir;
      let actualProfileName = profileName;

      // 임시 프로필 사용 옵션이 활성화된 경우
      if (options.useTempProfile) {
        // 기존 임시 디렉토리 재사용 또는 새 디렉토리 생성
        const safeProfileName = profileName.replace(/\s/g, '_').replace(/[/\\]/g, '_');
        const tempBaseName = `chrome-selenium-${safeProfileName}`;
        const existingTempDir = findExistingTempProfile(tempBaseName);

        if (existingTempDir) {
          console.log(`♻️  기존 임시 프로필을 재사용합니다: ${existingTempDir}`);
          this.tempUserDataDir = existingTempDir;
          actualUserDataDir = this.tempUserDataDir;
          actualProfileName = 'Default';
        } else {
          // 새 임시 디렉토리 생성 (타임스탬프 없이)
          this.tempUserDataDir = path.join(os.tmpdir(), tempBaseName);
          const tempProfilePath = path.join(this.tempUserDataDir, 'Default');

          console.log(`🆕 새 임시 프로필을 생성합니다: ${this.tempUserDataDir}`);

          // 프로필 데이터 복사
          const copySuccess = copyProfileData(profileName, tempProfilePath, baseUserDataDir);
          if (!copySuccess) {
            console.log('⚠️  프로필 데이터 복사에 실패했습니다. 빈 프로필로 진행합니다.');
          }

          actualUserDataDir = this.tempUserDataDir;
          actualProfileName = 'Default';
        }
      }

      // 컨테이너 환경에서도 프로필 사용 (강제 설정시에만 제한)
      if (!isContainerEnv || forceProfile || options.useTempProfile) {
        chromeOptions.addArguments(`--user-data-dir=${actualUserDataDir}`);
        chromeOptions.addArguments(`--profile-directory=${actualProfileName}`);
        console.log(`📁 Chrome 프로필 설정: ${actualUserDataDir}/${actualProfileName}`);

        if (isContainerEnv && forceProfile) {
          console.log('✅ Profile settings forced in container environment');
        }
      } else {
        console.warn('Profile settings skipped in container environment for stability (set FORCE_CHROME_PROFILE=true to override)');
        // 컨테이너에서 프로필 제한시 임시 프로필 사용
        const tempUserDataDir = `/tmp/chrome-selenium-${Date.now()}`;
        chromeOptions.addArguments(`--user-data-dir=${tempUserDataDir}`);
        console.log(`📁 임시 Chrome 프로필 사용 (컨테이너 환경): ${tempUserDataDir}`);
      }
    } else {
      // 프로필을 찾을 수 없는 경우만 임시 디렉토리 사용
      const tempUserDataDir = `/tmp/chrome-selenium-${Date.now()}`;
      chromeOptions.addArguments(`--user-data-dir=${tempUserDataDir}`);
      console.log(`📁 임시 Chrome 프로필 사용: ${tempUserDataDir}`);
      console.warn('⚠️ 프로필을 찾을 수 없어 임시 프로필을 생성합니다.');
    }

    // 기본 인자 설정 (프로필별로 차별화)
    let defaultArguments: string[] = [];
    
    if (profileName && profileName !== 'null' && profileName !== 'undefined') {
      // 실제 프로필 사용시 - 안정성 중심 옵션
      defaultArguments = [
        '--no-first-run',
        '--disable-default-apps',
        '--start-maximized',
        '--window-size=1920,1080',
        '--disable-popup-blocking',
        '--disable-notifications',
        '--ignore-certificate-errors',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-device-scale-factor=1',
        '--lang=ko-KR',
        '--accept-lang=ko-KR,ko,en-US,en',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ];
      console.log('🔧 실제 프로필 사용 - 안정성 중심 옵션 적용');
    } else {
      // 임시 프로필 사용시 - 자동화 감지 우회 중심 옵션
      defaultArguments = [
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
        '--disable-features=TranslateUI,VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-default-apps',
        '--remote-debugging-port=0',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-device-scale-factor=1',
        '--lang=ko-KR',
        '--accept-lang=ko-KR,ko,en-US,en',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        '--enable-automation',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-extensions-file-access-check',
        '--disable-component-extensions-with-background-pages'
      ];
      console.log('🔧 임시 프로필 사용 - 자동화 우회 옵션 적용');
    }

    // 기본 인자와 사용자 지정 인자를 합치기
    const finalArguments = [...defaultArguments, ...(options.arguments || [])];

    // 최종 인자 설정
    finalArguments.forEach((arg) => chromeOptions.addArguments(arg));

    // 자동화 관련 설정 제거
    chromeOptions.excludeSwitches('enable-automation');
    chromeOptions.excludeSwitches('enable-logging');
    chromeOptions.setUserPreferences({
      credentials_enable_service: false,
      'profile.password_manager_enabled': false,
      useAutomationExtension: false,
      excludeSwitches: ['enable-automation'],
      'profile.default_content_setting_values.notifications': 2,
      'profile.managed_default_content_settings.images': 1,
      'profile.default_content_settings.popups': 0,
      // 한글 폰트 설정
      'webkit.webprefs.fonts.standard.Hang': 'Noto Sans CJK KR',
      'webkit.webprefs.fonts.serif.Hang': 'Noto Serif CJK KR',
      'webkit.webprefs.fonts.sansserif.Hang': 'Noto Sans CJK KR',
      'webkit.webprefs.fonts.fixed.Hang': 'NanumGothicCoding',
      'webkit.webprefs.fonts.cursive.Hang': 'Noto Sans CJK KR',
      'webkit.webprefs.fonts.fantasy.Hang': 'Noto Sans CJK KR',
    });

    // 드라이버 초기화
    this.driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    // CDP를 통한 추가 설정
    this.driver.executeScript(`
      // navigator.webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome 자동화 관련 속성 제거
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    `);
  }

  async getFullSize() {
    await this.ensureInitialized();
    let lastHeight = 0;
    const scrollStep = 800; // 한 번에 스크롤할 픽셀 수
    let noChangeCount = 0; // 높이 변화 없음 카운터
    const maxNoChange = 3; // 최대 높이 변화 없음 횟수

    while (true) {
      // 현재 viewport 높이와 전체 문서 높이 가져오기
      const dimensions = (await this.driver.executeScript(`
        return {
          viewportHeight: window.innerHeight,
          documentHeight: Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          ),
          scrollY: window.scrollY || window.pageYOffset
        }
      `)) as { viewportHeight: number; documentHeight: number; scrollY: number };

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
      await this.driver.executeScript(`window.scrollTo(0, ${nextScroll})`);

      // 스크롤 후 대기 (동적 컨텐츠 로딩을 위한 시간)
      await this.driver.sleep(2000);

      // 추가 컨텐츠 로딩 대기
      await this.driver
        .wait(async () => {
          const newHeight = (await this.driver.executeScript(`
          return Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          )
        `)) as number;
          return newHeight >= documentHeight;
        }, 3000)
        .catch(() => { }); // 타임아웃 무시
    }

    // 마지막으로 전체 크기 확인
    const finalDimensions = (await this.driver.executeScript(`
      return {
        width: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
          document.documentElement.offsetWidth,
          document.body.offsetWidth
        ),
        height: Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        )
      }
    `)) as { width: number; height: number };

    return finalDimensions;
  }

  async _getFullScreenshot() {
    try {
      // 페이지 전체 크기 가져오기
      const { width, height } = await this.getFullSize();

      // 창 크기 설정
      await this.driver.manage().window().setRect({
        width: width,
        height: height,
      });

      // 스크린샷 데이터 반환
      return await this.driver.takeScreenshot();
    } catch (error) {
      console.error('스크린샷 촬영 중 오류 발생:', error);
      throw error;
    }
  }

  async getFullScreenshot() {
    try {
      return await this._getFullScreenshot();
    } finally {
      this.close();
    }
  }

  async saveScreenshot(path: string) {
    try {
      const image = await this._getFullScreenshot();
      saveFile(path, image, { encoding: 'base64' });
    } finally {
      this.close();
    }
  }

  async goto(url: string) {
    await this.ensureInitialized();
    await this.driver.get(url);
  }

  async wait(selector: string, options: any = {}) {
    await this.ensureInitialized();
    const { timeout = 10000, until: untilType = 'located' } = options;

    switch (untilType) {
      case 'clickable':
        return this.driver.wait(until.elementIsEnabled(await this.findElement(selector)), timeout);
      case 'visible':
        return this.driver.wait(until.elementIsVisible(await this.findElement(selector)), timeout);
      case 'invisible':
        return this.driver.wait(until.elementIsNotVisible(await this.findElement(selector)), timeout);
      case 'staleness':
        return this.driver.wait(until.stalenessOf(await this.findElement(selector)), timeout);
      case 'located':
      default:
        return this.driver.wait(until.elementLocated(By.css(selector)), timeout);
    }
  }

  // 요소 찾기
  async _findElements(by: string, value: string) {
    switch (by.toLowerCase()) {
      case 'id':
        return await this.driver.findElements(By.id(value));
      case 'name':
        return await this.driver.findElements(By.name(value));
      case 'css':
        return await this.driver.findElements(By.css(value));
      case 'xpath':
        return await this.driver.findElements(By.xpath(value));
      default:
        throw new Error(`지원하지 않는 선택자 타입: ${by}`);
    }
  }

  // 요소 찾기(css)
  async findElements(value: string) {
    await this.ensureInitialized();
    return await this.driver.findElements(By.css(value));
  }

  // 요소 찾기
  async _findElement(by: string, value: string) {
    switch (by.toLowerCase()) {
      case 'id':
        return await this.driver.findElement(By.id(value));
      case 'name':
        return await this.driver.findElement(By.name(value));
      case 'css':
        return await this.driver.findElement(By.css(value));
      case 'xpath':
        return await this.driver.findElement(By.xpath(value));
      default:
        throw new Error(`지원하지 않는 선택자 타입: ${by}`);
    }
  }

  // 요소 찾기(css)
  async findElement(value: string) {
    await this.ensureInitialized();
    return await this.driver.findElement(By.css(value));
  }

  // 페이지 소스 가져오기
  async getPageSource() {
    await this.ensureInitialized();
    return await this.driver.getPageSource();
  }

  // 요소의 HTML 가져오기
  async _getElementHtml(by: string, value: string) {
    const element = await this._findElement(by, value);
    return await element.getAttribute('outerHTML');
  }

  // 요소의 HTML 가져오기
  async getElementHtml(value: string) {
    return await (await this.findElement(value)).getAttribute('outerHTML');
  }

  // 요소 클릭
  async _click(by: string, value: string) {
    const element = await this._findElement(by, value);
    await element.click();
  }

  // 요소 클릭
  async click(selector: string) {
    const element = await this.findElement(selector);
    await this.scrollIntoView(element);
    await sleepAsync(1000);
    await element.click();
  }

  // 요소의 텍스트 가져오기
  async _getText(by: string, value: string) {
    const element = await this._findElement(by, value);
    return await element.getText();
  }

  // 요소의 텍스트 가져오기
  async getText(value: string) {
    const element = await this.findElement(value);
    return await element.getText();
  }

  // 요소의 속성 가져오기
  async _getAttribute(by: string, value: string, attribute: string) {
    const element = await this._findElement(by, value);
    return await element.getAttribute(attribute);
  }

  // 요소의 속성 가져오기
  async getAttribute(value: string, attribute: string) {
    const element = await this.findElement(value);
    return await element.getAttribute(attribute);
  }

  // 요소에 텍스트 입력하기
  async _sendKeys(by: string, value: string, text: string) {
    const element = await this._findElement(by, value);
    await element.sendKeys(text);
  }

  // 요소에 텍스트 입력하기
  async sendKeys(value: string, text: string) {
    const element = await this.findElement(value);
    await element.sendKeys(text);
  }

  // 특정 요소의 스크린샷 저장
  async _saveElementScreenshot(by: string, value: string, path: string) {
    const element = await this._findElement(by, value);
    const image = await element.takeScreenshot();
    saveFile(path, image, { encoding: 'base64' });
  }

  // 특정 요소의 스크린샷 저장
  async saveElementScreenshot(value: string, path: string) {
    const element = await this.findElement(value);
    const image = await element.takeScreenshot();
    saveFile(path, image, { encoding: 'base64' });
  }

  async executeScript(script: string, ...args: any[]) {
    await this.ensureInitialized();
    return this.driver.executeScript(script, ...args);
  }

  // async waitForElementToBeClickable(selector: string, timeout: number = 10000) {
  //   return this.driver.wait(until.elementIsEnabled(await this.findElement(selector)), timeout);
  // }

  async scrollIntoView(element: WebElement) {
    await this.executeScript('arguments[0].scrollIntoView(true);', element);
  }

  async close() {
    await this.ensureInitialized();
    if (this.driver) {
      await this.driver.quit();
    }

    // 로그인 상태 유지를 위해 임시 프로필은 삭제하지 않음
    if (this.tempUserDataDir && fs.existsSync(this.tempUserDataDir)) {
      console.log(`💾 로그인 상태 유지를 위해 임시 프로필을 보존합니다: ${this.tempUserDataDir}`);
      console.log('   다음 실행 시 이 프로필이 재사용됩니다.');
    }
  }
}

export { SeleniumChromeProfile, getSeleniumChromeProfileByEmail, copyProfileData, findExistingTempProfile };
