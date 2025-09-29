// Playwright Chrome Profile Example - bigwhitekmc@gmail.com
// 환경변수 명시적 설정 (Node.js에서 zsh 환경변수 인식 문제 해결)
process.env.CHROMIUM_USERDATA_PATH = '/Users/youchan/Library/Application Support/Google/Chrome';

import { PlaywrightChromeProfile } from '../esm/index.js';

console.log('🚀 Playwright Chrome Profile 예제 시작');
console.log(`🔧 CHROMIUM_USERDATA_PATH: ${process.env.CHROMIUM_USERDATA_PATH}`);

async function main() {
  const chrome = new PlaywrightChromeProfile({
    headless: false,  // 브라우저 화면에 보이도록 설정
    email: 'bigwhitekmc@gmail.com'  // 특정 이메일의 Chrome 프로필 사용
  });

  try {
    console.log('🌐 Google.com 접속 중...');
    await chrome.goto('https://www.google.com');
    
    console.log('⏳ 1초 대기...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📸 스크린샷 촬영 중...');
    await chrome.saveScreenshot('/Users/youchan/Coding/jnj/jnj-utils/npmjs/jnu-web/examples/screenshots/google-bigwhitekmc.png');
    
    console.log('⏳ 1분 대기...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('✅ 완료! 브라우저 종료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await chrome.close();
  }
}

main().catch(console.error);