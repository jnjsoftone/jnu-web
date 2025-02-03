import { PLATFORM } from 'jnu-abc';
import { Chrome, getProfileByEmail } from '../esm/chrome.js';
import dotenv from 'dotenv';
dotenv.config({ path: `../.env.${PLATFORM}` });

async function main() {
  try {
    const email = 'bigwhitekmc@gmail.com';
    // windows(.env.win)
    // const userDataDir = 'C:/Users/Jungsam/AppData/Local/Google/Chrome/User Data';
    // // macos(.env.mac)
    // const userDataDir = '/Users/moon/Library/Application Support/Google/Chrome';
    const userDataDir = process.env.USER_DATA_DIR;
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
