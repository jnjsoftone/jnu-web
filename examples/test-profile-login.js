// Test if Chrome loads with the correct profile and login status
// 환경변수 명시적 설정
process.env.CHROMIUM_USERDATA_PATH = '/Users/youchan/Library/Application Support/Google/Chrome';

import { PlaywrightChromeProfile } from '../esm/index.js';

console.log('🔍 프로필 로그인 상태 테스트 시작');

async function testProfileLogin() {
  const chrome = new PlaywrightChromeProfile({
    headless: false,  // 브라우저 화면에 보이도록 설정
    email: 'bigwhitekmc@gmail.com'
  });

  try {
    console.log('🌐 Gmail 접속하여 로그인 상태 확인...');
    await chrome.goto('https://mail.google.com');
    
    // 3초 대기 후 페이지 제목 확인
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const title = await chrome.page.title();
    const url = chrome.page.url();
    
    console.log(`📄 페이지 제목: ${title}`);
    console.log(`🔗 현재 URL: ${url}`);
    
    // 로그인 상태 확인
    if (url.includes('accounts.google.com') && url.includes('signin')) {
      console.log('❌ 로그인되지 않음 - 로그인 페이지로 리다이렉트됨');
    } else if (title.includes('Gmail') || url.includes('mail.google.com')) {
      console.log('✅ 로그인됨 - Gmail에 접근 성공');
    } else {
      console.log('⚠️ 알 수 없는 상태');
    }
    
    console.log('⏳ 10초 후 종료...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await chrome.close();
  }
}

testProfileLogin().catch(console.error);