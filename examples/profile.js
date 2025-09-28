// Example script for taking real screenshots
import { getPlaywrightChromeProfileByEmail, getSeleniumChromeProfileByEmail } from '../esm/index.js';
import fs from 'fs';
import path from 'path';

const email = 'bigwhitekmc@gmail.com'
// const email = 'ilinkrun@gmail.com'
// const email = 'test@gmail.com'

console.log("playwright", getPlaywrightChromeProfileByEmail(email))

console.log("selenium", getSeleniumChromeProfileByEmail(email))

