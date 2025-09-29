#!/usr/bin/env node

import { PlaywrightChromeProfile } from '../esm/playwright-chrome-profile.js';
import fs from 'fs';
import path from 'path';

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

  async takeScreenshotWithPlaywright(email, url = 'https://www.naver.com', outputDir = './examples/screenshots') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeEmail = email.replace(/[@.]/g, '_').replace(/[/\\]/g, '_');
    const filename = `screenshot_playwright_${safeEmail}_${timestamp}.png`;
    const outputPath = path.join(outputDir, filename);

    console.log('\n🚀 PlaywrightChromeProfile을 사용한 스크린샷');
    console.log(`   이메일: ${email}`);
    console.log(`   URL: ${url}`);
    console.log(`   출력 파일: ${outputPath}`);

    let chrome;

    try {
      // PlaywrightChromeProfile 인스턴스 생성 (이메일로 프로필 찾기, 임시 프로필 사용)
      chrome = new PlaywrightChromeProfile({
        headless: false,
        email: email,
        userDataDir: this.userDataPath,
        useTempProfile: true, // 임시 프로필 사용하여 로그인 상태 유지
        arguments: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-background-networking',
          '--allow-running-insecure-content',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      // 페이지로 이동
      console.log(`📄 페이지로 이동 중: ${url}`);
      await chrome.goto(url);

      // 페이지 로딩 대기
      console.log('⏳ 페이지 완전 로딩 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 현재 상태 확인
      console.log(`🔍 페이지 로드 완료`);

      // 스크린샷 저장
      console.log('📸 스크린샷 촬영 중...');
      await chrome.saveScreenshot(outputPath);

      console.log('✅ 스크린샷이 성공적으로 저장되었습니다!');
      console.log(`   📁 파일: ${outputPath}`);

      // 파일 크기 확인
      if (fs.existsSync(outputPath)) {
        const fileSize = fs.statSync(outputPath).size;
        console.log(`   📊 파일 크기: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

        // 파일이 너무 작으면 경고
        if (fileSize < 10000) {  // 10KB 미만
          console.log('   ⚠️  파일 크기가 작습니다. 페이지가 제대로 로드되지 않았을 수 있습니다.');
        }
      } else {
        console.log('   ❌ 스크린샷 파일이 생성되지 않았습니다!');
        throw new Error('스크린샷 파일 생성 실패');
      }

      console.log('\n⏰ Chrome 브라우저를 1분간 유지합니다 (로그인 상태 안정화)...');
      console.log('   브라우저에서 로그인 상태와 프로필 정보를 확인해보세요!');
      console.log('   필요시 Ctrl+C로 조기 종료 가능합니다...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1분 대기

      return outputPath;

    } finally {
      // 브라우저 종료
      if (chrome) {
        await chrome.close();
      }
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
          // 프로필 크기 계산
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
    console.log('🖥️  PlaywrightChromeProfile을 사용한 스크린샷 도구');
    console.log('=' .repeat(60));

    const screenshotTool = new ChromeProfileScreenshot();
    screenshotTool.printProfileInfo();

    // 이메일 입력받기
    let email;
    if (process.argv.length > 2) {
      email = process.argv[2];
    } else {
      email = ''; // 기본값으로 설정 (빈 문자열이면 Default 프로필 사용)
      console.log(`\n사용할 이메일: (기본값 - Default 프로필 사용)`);
      console.log('특정 이메일의 프로필을 사용하려면: node screenshot2.js "bigwhitekmc@gmail.com"');
    }

    if (!email) {
      console.log('⚠️  이메일이 입력되지 않아 Default 프로필을 사용합니다.');
      email = ''; // 빈 문자열로 설정하여 Default 프로필 사용
    }

    // URL 입력받기
    let url;
    if (process.argv.length > 3) {
      url = process.argv[3];
    } else {
      url = 'https://www.naver.com';
    }

    console.log(`\n🎯 작업 시작: 이메일 '${email || 'Default 프로필'}' 사용 (PlaywrightChromeProfile)`);
    console.log(`   📍 대상 URL: ${url}`);
    console.log('   💾 임시 프로필을 사용합니다 (로그인 상태 유지)');

    // 스크린샷 촬영
    const outputPath = await screenshotTool.takeScreenshotWithPlaywright(email, url, './examples/screenshots');

    console.log('\n🎉 작업 완료!');
    console.log(`   📸 스크린샷: ${outputPath}`);
    console.log(`   🔍 탐색기에서 열기: explorer ${path.dirname(outputPath).replace(/\//g, '\\')}`);

    // 추가 정보
    if (fs.existsSync(outputPath)) {
      const fileSize = fs.statSync(outputPath).size;
      console.log(`   📊 최종 파일 크기: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
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

// ES 모듈에서는 항상 main 함수 실행
main().catch(console.error);

export { ChromeProfileScreenshot };