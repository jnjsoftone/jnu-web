import { goChrome } from 'jnu-web';
// import { goChrome } from '../esm/chromeBasic.js';

// const browser = new ChromeBasic();
// await browser.initialize({ headless: false });
// await browser.goto('https://www.google.com');
// const html = await browser.driver.getPageSource();
// console.log(html);
// await browser.close();

const driver = await goChrome('https://www.google.com');
const html = await driver.getPageSource();
console.log(html);
await driver.quit();
