import { Chrome, getProfileByEmail } from '../esm/chrome.js';

async function main() {
  try {
    const email = 'bigwhitekmc@gmail.com';
    const userDataDir = '/Users/moon/Library/Application Support/Google/Chrome';
    const profileName = getProfileByEmail(email, userDataDir) ?? '';
    console.log('프로필명:', profileName);

    const browser = new Chrome({
      headless: false,
      profileName,
      userDataDir,
    });

    await browser.goto('https://www.google.com');
    const source = await browser.getPageSource();
    console.log('페이지 소스:', source);
    await browser.close();
  } catch (error) {
    console.error('에러 발생:', error);
  }
}

// 메인 함수 실행
main().catch(console.error);
