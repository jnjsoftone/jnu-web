// npm install cheerio selenium-webdriver axios
// npm install @types/selenium-webdriver

export { reqGet, reqPost, reqPatch, reqDelete, reqUpsert, reqGql } from './request.js';
export { Cheer } from './cheer.js';
export { Chrome, getProfileByEmail } from './chrome.js';
export { mdContent, mdFrontmatter } from './markdn.js';
export {
  escapeRegExp,
  escapeMarkdown,
  escapeValue,
  unescapeValue,
  escapeDoubleQuotes,
  formatVariables,
  escapeHtml,
  makeUrlAbsolute,
  formatDuration,
} from './utils-string.js';
