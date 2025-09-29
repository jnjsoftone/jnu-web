/**
 * Connect to Existing Chrome with Profile
 * 
 * Chrome을 프로필과 함께 직접 실행한 후
 * Playwright로 연결하는 방법
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

async function connectToExistingChrome() {
  let browser = null;
  let context = null;
  let page = null;
  let chromeProcess = null;

  try {
    console.log('🚀 Chrome을 프로필과 함께 직접 실행 중...');

    // Chrome 프로세스 종료
    try {
      execSync('pkill -f "Google Chrome"', { stdio: 'ignore' });
      console.log('🔄 기존 Chrome 프로세스 종료');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // 프로세스가 없으면 무시
    }

    // bigwhitekmc@gmail.com 프로필로 Chrome 실행 (Profile 39가 정확한 프로필)
    const chromeProfilePath = '/Users/youchan/Library/Application Support/Google/Chrome/Profile 39';
    const chromeDataDir = '/Users/youchan/Library/Application Support/Google/Chrome';
    
    if (!fs.existsSync(chromeProfilePath)) {
      throw new Error(`Chrome 프로필을 찾을 수 없습니다: ${chromeProfilePath}`);
    }

    console.log(`📁 Chrome 프로필: ${chromeProfilePath}`);

    // Chrome을 디버깅 모드로 실행
    const chromeArgs = [
      '--remote-debugging-port=9222',
      `--user-data-dir=${chromeDataDir}`,
      `--profile-directory=Profile 39`,
      '--no-first-run',
      '--disable-default-apps',
      '--start-maximized',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor'
    ];

    console.log('🌐 Chrome 실행 중...');
    chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', chromeArgs, {
      detached: true,
      stdio: 'ignore'
    });

    // Chrome이 완전히 시작될 때까지 대기
    console.log('⏳ Chrome 시작 대기 중... (5초)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Playwright로 실행 중인 Chrome에 연결
    console.log('🔗 Playwright로 Chrome에 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // 기본 컨텍스트 가져오기
    const contexts = browser.contexts();
    context = contexts.length > 0 ? contexts[0] : await browser.newContext();

    // 페이지 가져오기 또는 생성
    const pages = await context.pages();
    if (pages.length > 0) {
      page = pages[0];
    } else {
      page = await context.newPage();
    }

    console.log('✅ Chrome 연결 완료');

    // 현재 페이지 확인
    console.log(`🔍 현재 URL: ${page.url()}`);

    // Google로 이동
    console.log('🌐 Google.com 접속 중...');
    await page.goto('https://google.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 로그인 상태 확인
    console.log('👤 로그인 상태 확인 중...');
    try {
      const title = await page.title();
      console.log(`📄 페이지 제목: ${title}`);

      // Google 계정 관련 요소 확인
      const accountElement = await page.$('[data-ved] a[href*="accounts.google.com"], .gb_d, [aria-label*="Google 계정"]');
      if (accountElement) {
        const text = await accountElement.textContent();
        console.log(`✅ 계정 요소 발견: ${text}`);
      } else {
        console.log('ℹ️ 계정 요소를 찾을 수 없습니다');
      }
    } catch (error) {
      console.log('ℹ️ 로그인 상태 확인 실패:', error.message);
    }

    console.log('📸 스크린샷 촬영 중...');
    
    // 스크린샷 저장
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const screenshotPath = path.join(__dirname, 'screenshots', `google-connected-${Date.now()}.png`);
    
    const screenshotDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });

    console.log(`✅ 스크린샷 저장: ${screenshotPath}`);
    console.log(`📧 프로필: bigwhitekmc@gmail.com (Profile 39)`);
    console.log(`🏗️ 연결 방식: Chrome 직접 실행 + Playwright 연결`);

    console.log('⏰ 1분 대기 중...');
    console.log('💡 브라우저에서 직접 로그인 상태를 확인하세요!');
    console.log('💡 이 방법으로 실제 Chrome 프로필이 로드되었는지 확인하세요!');
    
    // 1분 대기
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('🔚 연결 종료 중...');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    // Playwright 연결 종료 (Chrome은 계속 실행)
    if (browser) {
      await browser.close();
      console.log('✅ Playwright 연결 종료');
    }

    // Chrome 프로세스 종료
    if (chromeProcess) {
      try {
        process.kill(-chromeProcess.pid);
        console.log('✅ Chrome 프로세스 종료');
      } catch (error) {
        console.log('ℹ️ Chrome 프로세스 종료 실패 (이미 종료되었을 수 있음)');
      }
    }
  }
}

// 예제 실행
connectToExistingChrome()
  .then(() => {
    console.log('🎉 예제 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 예제 실행 실패:', error);
    process.exit(1);
  });