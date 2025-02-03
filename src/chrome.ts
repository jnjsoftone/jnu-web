import { Builder, By, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { loadJson, findFolders, saveFile, sleepAsync } from 'jnu-abc';
import { until } from 'selenium-webdriver';

// 프로필 찾기
const getProfileByEmail = (email = '', userDataDir = '') => {
  if (!userDataDir) {
    return null;
  }
  const folders = findFolders(userDataDir, 'Profile');
  // console.log(`folders: ${folders}`);
  for (const folder of folders) {
    const json = loadJson(`${folder}/Preferences`);
    if (json.account_info && json.account_info.length > 0) {
      if (json.account_info[0].email === email) {
        return folder.replace(/\\/g, '/').split('/').pop() || null;
      }
    }
  }
  return null;
};

class Chrome {
  public driver: WebDriver;

  constructor(
    options: {
      headless?: boolean;
      profileName?: string;
      email?: string;
      userDataDir?: string;
      arguments?: string[];
    } = { headless: false, profileName: '', email: '', userDataDir: '', arguments: [] }
  ) {
    const chromeOptions = new chrome.Options();

    // 기본 옵션 설정
    if (options.headless) {
      chromeOptions.addArguments('--headless=new'); // 새로운 헤드리스 모드 사용
    }

    const profileName = options.profileName ?? getProfileByEmail(options.email, options.userDataDir) ?? null;

    // 프로필 설정
    if (profileName) {
      chromeOptions.addArguments(`--user-data-dir=${options.userDataDir}`);
      chromeOptions.addArguments(`--profile-directory=${profileName}`);
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
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'  // 최신 Chrome 유저 에이전트
    ];

    // 기본 인자와 사용자 지정 인자를 합치기
    const finalArguments = [...defaultArguments, ...(options.arguments || [])];

    // 최종 인자 설정
    finalArguments.forEach((arg) => chromeOptions.addArguments(arg));

    // 자동화 관련 설정 제거
    chromeOptions.excludeSwitches(['enable-automation', 'enable-logging']);
    chromeOptions.setUserPreferences({
      credentials_enable_service: false,
      'profile.password_manager_enabled': false,
      useAutomationExtension: false,
      excludeSwitches: ['enable-automation'],
      'profile.default_content_setting_values.notifications': 2,
      'profile.managed_default_content_settings.images': 1,
      'profile.default_content_settings.popups': 0
    });

    // 드라이버 초기화
    this.driver = new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

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
      await this.driver.sleep(1000);

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
        }, 2000)
        .catch(() => {}); // 타임아웃 무시
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
    await this.driver.get(url);
  }

  async close() {
    await this.driver.quit();
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
    return await this.driver.findElement(By.css(value));
  }

  // 페이지 소스 가져오기
  async getPageSource() {
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
    return this.driver.executeScript(script, ...args);
  }

  async waitForElementToBeClickable(selector: string, timeout: number = 10000) {
    return this.driver.wait(until.elementIsEnabled(await this.findElement(selector)), timeout);
  }

  async scrollIntoView(element: WebElement) {
    await this.executeScript('arguments[0].scrollIntoView(true);', element);
  }
}

export { Chrome, getProfileByEmail };
