#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class ChromeProfileScreenshot {
  constructor() {
    // 환경변수에서 Chrome 경로 가져오기
    this.chromeExecutable = process.env.CHROMIUM_EXECUTABLE_PATH || 
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    this.userDataPath = process.env.CHROMIUM_USERDATA_PATH || 
      '/Users/youchan/Library/Application Support/Google/Chrome';

    console.log('🔧 설정 정보:');
    console.log(`   Chrome 실행파일: ${this.chromeExecutable}`);
    console.log(`   사용자 데이터: ${this.userDataPath}`);

    // 경로 검증
    if (!fs.existsSync(this.chromeExecutable)) {
      throw new Error(`Chrome 실행 파일을 찾을 수 없습니다: ${this.chromeExecutable}`);
    }

    if (!fs.existsSync(this.userDataPath)) {
      throw new Error(`Chrome 사용자 데이터 경로를 찾을 수 없습니다: ${this.userDataPath}`);
    }
  }

  killExistingChromeProcesses() {
    try {
      console.log('🔄 기존 Chrome 프로세스를 확인합니다...');
      
      // Chrome 프로세스 찾기
      try {
        const result = execSync('pgrep -f "Google Chrome"', { encoding: 'utf8' });
        
        if (result.trim()) {
          const pids = result.trim().split('\n');
          console.log(`   발견된 Chrome 프로세스: ${pids.length}개`);
          
          // 자동으로 종료 (사용자 확인 없이)
          for (const pid of pids) {
            try {
              execSync(`kill -TERM ${pid}`, { stdio: 'ignore' });
              console.log(`   ✅ 프로세스 ${pid} 종료 요청됨`);
            } catch (error) {
              console.log(`   ⚠️  프로세스 ${pid} 종료 실패`);
            }
          }

          // 프로세스 종료 대기
          console.log('   ⏳ Chrome 종료 대기 중...');
          setTimeout(() => {}, 5000); // 5초 대기

          // 강제 종료가 필요한지 확인
          try {
            const result2 = execSync('pgrep -f "Google Chrome"', { encoding: 'utf8' });
            if (result2.trim()) {
              console.log('   🔨 일부 프로세스가 남아있어 강제 종료합니다...');
              const remainingPids = result2.trim().split('\n');
              for (const pid of remainingPids) {
                try {
                  execSync(`kill -KILL ${pid}`, { stdio: 'ignore' });
                  console.log(`   💀 프로세스 ${pid} 강제 종료됨`);
                } catch (error) {
                  console.log(`   ⚠️  프로세스 ${pid} 강제 종료 실패`);
                }
              }
            }
          } catch (error) {
            // 프로세스가 없으면 정상
          }
        } else {
          console.log('   ✅ 실행 중인 Chrome 프로세스가 없습니다.');
        }
      } catch (error) {
        console.log('   ✅ 실행 중인 Chrome 프로세스가 없습니다.');
      }
    } catch (error) {
      console.log(`   ⚠️  프로세스 확인 중 오류: ${error.message}`);
    }
  }

  validateProfile(profileName) {
    const profilePath = path.join(this.userDataPath, profileName);

    if (!fs.existsSync(profilePath)) {
      const availableProfiles = this.getAvailableProfiles();
      let errorMsg = `프로필 '${profileName}'을 찾을 수 없습니다.`;
      if (availableProfiles.length > 0) {
        errorMsg += `\n사용 가능한 프로필: ${availableProfiles.slice(0, 5).join(', ')}`;
        if (availableProfiles.length > 5) {
          errorMsg += ` ... 및 ${availableProfiles.length - 5}개 더`;
        }
      } else {
        errorMsg += '\n사용 가능한 프로필이 없습니다.';
      }
      throw new Error(errorMsg);
    }

    return profilePath;
  }

  getAvailableProfiles() {
    const userDataDir = this.userDataPath;
    const profiles = [];

    if (!fs.existsSync(userDataDir)) {
      return profiles;
    }

    // Default 프로필 확인
    if (fs.existsSync(path.join(userDataDir, 'Default'))) {
      profiles.push('Default');
    }

    // Profile X 형태의 프로필들 확인
    const items = fs.readdirSync(userDataDir);
    for (const item of items) {
      if (item.startsWith('Profile ')) {
        const itemPath = path.join(userDataDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          profiles.push(item);
        }
      }
    }

    return profiles.sort();
  }

  copyProfileData(sourceProfile, tempProfileDir) {
    console.log('📋 프로필 데이터를 복사합니다...');

    const sourcePath = path.join(this.userDataPath, sourceProfile);
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
          console.log(`   ⚠️  ${fileName} 복사 실패: ${error.message}`);
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
          console.log(`   ⚠️  ${dirName}/ 복사 실패: ${error.message}`);
        }
      }
    }

    console.log(`   📊 총 ${copiedFiles}개 항목이 복사되었습니다.`);
    return copiedFiles > 0;
  }

  async takeScreenshotWithRealProfile(profileName, url = 'https://www.naver.com', outputDir = './examples/screenshots', useOriginalProfile = false) {
    const profilePath = this.validateProfile(profileName);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeProfileName = profileName.replace(/\s/g, '_').replace(/\//g, '_');
    const filename = `screenshot_${safeProfileName}_${timestamp}.png`;
    const outputPath = path.join(outputDir, filename);

    console.log('\n🚀 실제 Chrome 프로필 사용 스크린샷');
    console.log(`   프로필: ${profileName}`);
    console.log(`   프로필 경로: ${profilePath}`);
    console.log(`   URL: ${url}`);
    console.log(`   출력 파일: ${outputPath}`);

    let actualUserDataDir;
    let actualProfileName;

    if (useOriginalProfile) {
      // 원본 프로필 직접 사용
      console.log('🔧 원본 프로필을 직접 사용합니다...');
      actualUserDataDir = this.userDataPath;
      actualProfileName = profileName;
    } else {
      // 임시 사용자 데이터 디렉토리 생성
      const tempUserData = path.join(os.tmpdir(), `chrome-profile-${timestamp}`);
      const tempProfilePath = path.join(tempUserData, 'Default');
      
      // 프로필 데이터 복사
      if (!this.copyProfileData(profileName, tempProfilePath)) {
        console.log('⚠️  프로필 데이터 복사에 실패했습니다. 빈 프로필로 진행합니다.');
      }
      
      actualUserDataDir = tempUserData;
      actualProfileName = 'Default';
    }

    try {
      console.log('🌐 Chrome을 프로필과 함께 시작합니다...');

      // launch_persistent_context를 사용하여 프로필 로드
      const context = await chromium.launchPersistentContext(actualUserDataDir, {
        executablePath: this.chromeExecutable,
        headless: false,  // GUI 모드로 실행
        args: [
          '--start-maximized',
          `--profile-directory=${actualProfileName}`,
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        viewport: { width: 1920, height: 1080 },
        ignoreDefaultArgs: [
          '--enable-automation', 
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-extensions',
          '--enable-blink-features=AutomationControlled'
        ],
        acceptDownloads: true,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul'
      });

      // 기존 페이지가 있으면 사용, 없으면 새로 생성
      let page;
      if (context.pages().length > 0) {
        page = context.pages()[0];
      } else {
        page = await context.newPage();
      }

      // User-Agent 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      });

      // 자동화 감지 방지 스크립트 실행
      await page.addInitScript(() => {
        // webdriver 속성 제거
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // automation 관련 속성들 숨기기
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };

        // permissions API 오버라이드
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // plugins 정보 추가
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // languages 설정
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ko-KR', 'ko', 'en-US', 'en'],
        });
      });

      console.log(`📄 페이지로 이동 중: ${url}`);

      try {
        // 페이지 이동 (더 긴 타임아웃)
        const response = await page.goto(url, { 
          waitUntil: 'networkidle', 
          timeout: 45000 
        });
        console.log(`📡 응답 상태: ${response ? response.status() : 'None'}`);

        if (response && response.status() >= 400) {
          console.log(`⚠️  HTTP 오류 상태: ${response.status()}`);
        }
      } catch (error) {
        console.log(`⚠️  networkidle 대기 실패: ${error.message}`);
        try {
          // domcontentloaded로 재시도
          const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
          });
          console.log(`📡 재시도 응답 상태: ${response ? response.status() : 'None'}`);
        } catch (error2) {
          console.log(`❌ 페이지 로드 완전 실패: ${error2.message}`);
          throw error2;
        }
      }

      // 페이지 로딩 대기
      console.log('⏳ 페이지 완전 로딩 대기 중...');
      await page.waitForTimeout(8000);

      // 현재 상태 확인
      const currentUrl = page.url();
      const currentTitle = await page.title();
      console.log(`🔍 현재 URL: ${currentUrl}`);
      console.log(`📋 페이지 제목: ${currentTitle}`);

      // about:blank이거나 제목이 없으면 재시도
      if (currentUrl === 'about:blank' || !currentTitle.trim()) {
        console.log('⚠️  페이지가 제대로 로드되지 않았습니다. 강제 새로고침을 시도합니다...');

        try {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(5000);

          const newCurrentUrl = page.url();
          const newCurrentTitle = await page.title();
          console.log(`🔍 새로고침 후 URL: ${newCurrentUrl}`);
          console.log(`📋 새로고침 후 제목: ${newCurrentTitle}`);
        } catch (error) {
          console.log(`⚠️  새로고침 실패: ${error.message}`);
        }
      }

      // 로그인 상태 확인 (네이버의 경우)
      if (currentUrl.includes('naver.com')) {
        try {
          // 로그인 버튼 또는 로그인된 사용자 정보 확인
          const loginElements = await page.$$('a[href*="login"], .MyView-module__link_login, .gnb_name');
          if (loginElements.length > 0) {
            console.log('🔐 네이버 로그인 상태를 확인했습니다.');
          }
        } catch (error) {
          // 무시
        }
      }

      console.log('📸 스크린샷 촬영 중...');

      // 전체 페이지 스크린샷
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
      });

      console.log('✅ 스크린샷이 성공적으로 저장되었습니다!');
      console.log(`   📁 파일: ${outputPath}`);

      // 파일 크기 확인
      if (fs.existsSync(outputPath)) {
        const fileSize = fs.statSync(outputPath).size;
        console.log(`   📊 파일 크기: ${(fileSize / 1024).toFixed(1)} KB`);

        // 파일이 너무 작으면 경고
        if (fileSize < 10000) {  // 10KB 미만
          console.log('   ⚠️  파일 크기가 작습니다. 페이지가 제대로 로드되지 않았을 수 있습니다.');
        }
      } else {
        console.log('   ❌ 스크린샷 파일이 생성되지 않았습니다!');
        throw new Error('스크린샷 파일 생성 실패');
      }

      console.log('\n⏰ Chrome 브라우저를 3분간 유지합니다 (로그인 상태 안정화)...');
      console.log('   브라우저에서 로그인 상태와 프로필 정보를 확인해보세요!');
      console.log('   보안 검증을 위해 3분간 대기합니다...');
      await page.waitForTimeout(180000); // 3분 = 180초

      // 컨텍스트 종료
      await context.close();

      return outputPath;

    } finally {
      // 임시 디렉토리 정리 (원본 프로필 사용 시에는 정리하지 않음)
      if (!useOriginalProfile) {
        try {
          if (fs.existsSync(actualUserDataDir)) {
            fs.rmSync(actualUserDataDir, { recursive: true, force: true });
            console.log(`🗑️  임시 프로필 디렉토리 정리됨: ${actualUserDataDir}`);
          }
        } catch (error) {
          console.log(`⚠️  임시 디렉토리 정리 실패: ${error.message}`);
        }
      }
    }
  }

  async takeScreenshot(profileName, url = 'https://www.naver.com', outputDir = './examples/screenshots') {
    // 기존 Chrome 프로세스 확인
    this.killExistingChromeProcesses();

    try {
      return await this.takeScreenshotWithRealProfile(profileName, url, outputDir);
    } catch (error) {
      console.log(`❌ 프로필 스크린샷 실패: ${error.message}`);
      throw error;
    }
  }

  printProfileInfo() {
    console.log('\n📁 Chrome 프로필 정보:');
    console.log(`   📂 경로: ${this.userDataPath}`);

    const availableProfiles = this.getAvailableProfiles();
    if (availableProfiles.length > 0) {
      console.log(`   📋 사용 가능한 프로필: ${availableProfiles.length}개`);

      // 처음 10개만 표시
      const displayCount = Math.min(10, availableProfiles.length);
      for (let i = 0; i < displayCount; i++) {
        const profile = availableProfiles[i];
        const profilePath = path.join(this.userDataPath, profile);
        try {
          // 프로필 크기 계산 (빠른 계산을 위해 주요 파일들만)
          let size = 0;
          const files = ['Cookies', 'Login Data', 'History', 'Preferences'];
          for (const fileName of files) {
            const filePath = path.join(profilePath, fileName);
            if (fs.existsSync(filePath)) {
              size += fs.statSync(filePath).size;
            }
          }

          const sizeMb = (size / (1024 * 1024)).toFixed(1);

          // 로그인 데이터 확인
          const loginDataExists = fs.existsSync(path.join(profilePath, 'Login Data'));
          const cookiesExist = fs.existsSync(path.join(profilePath, 'Cookies'));

          let status = '';
          if (loginDataExists && cookiesExist) {
            status = ' 🔐';
          } else if (cookiesExist) {
            status = ' 🍪';
          }

          console.log(`      ${i + 1}. ${profile} (${sizeMb}MB)${status}`);
        } catch (error) {
          console.log(`      ${i + 1}. ${profile} (크기 확인 실패)`);
        }
      }

      if (availableProfiles.length > displayCount) {
        console.log(`      ... 및 ${availableProfiles.length - displayCount}개 더`);
      }

      console.log('\n   🔐 = 로그인 데이터 있음, 🍪 = 쿠키만 있음');
    } else {
      console.log('   ⚠️  사용 가능한 프로필이 없습니다.');
    }
  }
}

async function main() {
  try {
    console.log('🖥️  Chrome 프로필 스크린샷 도구 (실제 프로필 사용)');
    console.log('=' .repeat(60));

    const screenshotTool = new ChromeProfileScreenshot();
    screenshotTool.printProfileInfo();

    // 프로필 이름 입력받기
    let profileName;
    if (process.argv.length > 2) {
      profileName = process.argv[2];
    } else {
      // Node.js에서 입력받기 (간단한 방법)
      profileName = 'Default'; // 기본값으로 설정
      console.log(`\n사용할 프로필: ${profileName} (기본값)`);
      console.log('다른 프로필을 사용하려면: node screenshot-temp.js "Profile 1"');
    }

    if (!profileName) {
      console.log('❌ 프로필 이름이 입력되지 않았습니다.');
      return;
    }

    // URL 입력받기
    let url;
    if (process.argv.length > 3) {
      url = process.argv[3];
    } else {
      url = 'https://www.naver.com';
    }

    console.log(`\n🎯 작업 시작: Chrome 프로필 '${profileName}' 사용`);
    console.log(`   📍 대상 URL: ${url}`);

    // 원본 프로필 사용 여부 확인 (4번째 인수)
    const useOriginal = process.argv[4] === 'original';
    if (useOriginal) {
      console.log('   🔧 원본 프로필을 직접 사용합니다 (로그인 상태 유지)');
    }

    // 스크린샷 촬영
    const outputPath = await screenshotTool.takeScreenshotWithRealProfile(profileName, url, './examples/screenshots', useOriginal);

    console.log('\n🎉 작업 완료!');
    console.log(`   📸 스크린샷: ${outputPath}`);
    console.log(`   🔍 Finder에서 열기: open ${path.dirname(outputPath)}`);

    // 추가 정보
    if (fs.existsSync(outputPath)) {
      const fileSize = fs.statSync(outputPath).size;
      console.log(`   📊 최종 파일 크기: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // 이미지 미리보기 (macOS)
      try {
        execSync(`open -a Preview "${outputPath}"`, { stdio: 'ignore' });
        console.log('   👁️  Preview 앱으로 이미지를 열었습니다.');
      } catch (error) {
        // 무시
      }
    }

  } catch (error) {
    if (error.message.includes('Keyboard interrupt')) {
      console.log('\n\n⏹️  사용자에 의해 중단되었습니다.');
    } else {
      console.log(`\n❌ 최종 오류: ${error.message}`);
      console.log('\n🔧 해결 방법:');
      console.log('   1. Chrome을 완전히 종료한 후 재시도');
      console.log('   2. 네트워크 연결 확인');
      console.log('   3. 프로필 이름 확인 (대소문자 정확히)');
      console.log('   4. 다른 URL로 테스트 (예: https://www.google.com)');
      console.log('   5. screenshots 디렉토리 권한 확인');
      process.exit(1);
    }
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { ChromeProfileScreenshot };