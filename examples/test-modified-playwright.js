/**
 * Test Modified PlaywrightChromeProfile
 * 
 * 수정된 PlaywrightChromeProfile 클래스를 테스트하여
 * bigwhitekmc@gmail.com 프로필로 Google에 접속하고 
 * 스크린샷을 찍은 후 1분 후에 브라우저를 닫는 예제
 */

import { PlaywrightChromeProfile } from '../esm/index.js';
import fs from 'fs';
import path from 'path';

async function testModifiedPlaywright() {
  let chrome = null;

  try {
    console.log('🚀 수정된 PlaywrightChromeProfile 테스트 시작...');
    
    // bigwhitekmc@gmail.com 프로필로 Chrome 인스턴스 생성
    chrome = new PlaywrightChromeProfile({
      headless: false,
      // email: 'bigwhitekmc@gmail.com'
      email: 'ilinkrun@gmail.com'
    });

    console.log('🌐 Google.com 접속 중...');
    await chrome.goto('https://google.com');

    // 페이지 로딩 대기
    await chrome.page.waitForLoadState('networkidle');

    console.log('📸 스크린샷 촬영 중...');
    
    // 스크린샷 저장 경로 설정
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const screenshotPath = path.join(__dirname, 'screenshots', `google-modified-${Date.now()}.png`);
    
    // 스크린샷 디렉토리 생성
    const screenshotDir = path.dirname(screenshotPath);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // 스크린샷 저장
    await chrome.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });

    console.log(`✅ 스크린샷 저장 완료: ${screenshotPath}`);
    console.log(`📧 프로필: bigwhitekmc@gmail.com (자동 감지)`);
    console.log(`🏗️ 브라우저: 수정된 PlaywrightChromeProfile (CDP 연결)`);

    console.log('⏰ 1분 대기 중... (브라우저가 열린 상태로 유지됩니다)');
    console.log('💡 브라우저에서 직접 로그인 상태를 확인하세요!');
    console.log('💡 이제 올바른 bigwhitekmc@gmail.com 프로필이 로드되었는지 확인하세요!');
    
    // 1분(60초) 대기
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('🔚 브라우저 종료 중...');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    // 브라우저 종료
    if (chrome) {
      await chrome.close();
      console.log('✅ PlaywrightChromeProfile 종료 완료');
    }
  }
}

// 예제 실행
testModifiedPlaywright()
  .then(() => {
    console.log('🎉 수정된 PlaywrightChromeProfile 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 테스트 실행 실패:', error);
    process.exit(1);
  });