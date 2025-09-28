import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { loadJson, saveFile, sleepAsync } from 'jnu-abc';
import { until } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';

const CHROMIUM_EXECUTABLE_PATH = process.env.CHROMIUM_EXECUTABLE_PATH
const CHROMIUM_USERDATA_PATH = process.env.CHROMIUM_USERDATA_PATH

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
const getSeleniumChromeProfileByEmail = (email = '', userDataDir = '') => {
  // userDataDir가 비어있으면 CHROMIUM_USERDATA_PATH 사용
  if (!userDataDir) {
    userDataDir = CHROMIUM_USERDATA_PATH || '/root/.config/google-chrome';
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
          if (json.account_info[0].email === email) {
            return folder.replace(/\\/g, '/').split('/').pop() || null;
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


class SeleniumChromeProfile {
  public driver!: WebDriver;
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
  }) {
    const chromeOptions = new chrome.Options();

    // Chromium 실행 경로 설정
    if (process.env.CHROMIUM_EXECUTABLE_PATH) {
      chromeOptions.setChromeBinaryPath(process.env.CHROMIUM_EXECUTABLE_PATH);
    }

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

    // 프로필 설정 (container 환경에서는 skip, 단 강제 설정 시 사용)
    if (profileName && (!isContainerEnv || forceProfile)) {
      chromeOptions.addArguments(`--user-data-dir=${options.userDataDir}`);
      chromeOptions.addArguments(`--profile-directory=${profileName}`);
      if (isContainerEnv && forceProfile) {
        console.log('✅ Profile settings forced in container environment');
      }
    } else if (profileName && isContainerEnv && !forceProfile) {
      console.warn('Profile settings skipped in container environment for stability (set FORCE_CHROME_PROFILE=true to override)');
    }

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
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', // 최신 Chrome 유저 에이전트
    ];

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
  }
}

export { SeleniumChromeProfile, getSeleniumChromeProfileByEmail };
