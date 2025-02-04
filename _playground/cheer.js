import { Cheer } from '../esm/cheer.js';

const html = '<html><body><div class="target"></div></body></html>';

const cheer = new Cheer(html);
// 함수 직접 사용
// const $ = cheerio.load(html);
cheer.add('<div>새로운 요소</div>', '.target', 'after');

console.log(cheer.html('html'));

cheer.retag('div.target', 'section');

console.log(cheer.html('html'));

cheer.del('section');

console.log(cheer.html('html'));

// // Cheer 클래스 사용
// const cheerio = new Cheer(html);

// // 대상 요소 뒤에 추가
// cheerio.add('<li>새 항목</li>', '.apple', 'after');

// // 대상 요소 앞에 추가
// cheerio.add('<li>새 항목</li>', '.apple', 'before');

// // 대상 요소의 마지막 자식으로 추가
// cheerio.add('<li>새 항목</li>', 'ul', 'append');

// // 대상 요소의 첫 번째 자식으로 추가
// cheerio.add('<li>새 항목</li>', 'ul', 'prepend');

// // ---

// // 함수 직접 사용
// const $ = cheerio.load(html);

// // 대상 요소의 자식으로 추가 (기본값)
// addElement($, '<li>새 항목</li>', 'ul');
// // 또는
// addElement($, '<li>새 항목</li>', 'ul', 'append');

// // 대상 요소 앞에 추가
// addElement($, '<li>새 항목</li>', '.apple', 'before');

// // Cheer 클래스 사용
// const cheerio = new Cheer(html);

// // 대상 요소의 자식으로 추가 (기본값)
// cheerio.add('<li>새 항목</li>', 'ul');
// // 또는
// cheerio.add('<li>새 항목</li>', 'ul', 'append');

// // 대상 요소 앞에 추가
// cheerio.add('<li>새 항목</li>', '.apple', 'before');

// //---

// // 함수 직접 사용
// const $ = cheerio.load(html);

// // 대상 요소 뒤에 추가 (기본값)
// addElement($, '<li>새 항목</li>', '.apple');
// // 또는
// addElement($, '<li>새 항목</li>', '.apple', 'after');

// // 대상 요소 앞에 추가
// addElement($, '<li>새 항목</li>', '.apple', 'before');

// // Cheer 클래스 사용
// const cheerio = new Cheer(html);

// // 대상 요소 뒤에 추가 (기본값)
// cheerio.add('<li>새 항목</li>', '.apple');
// // 또는
// cheerio.add('<li>새 항목</li>', '.apple', 'after');

// // 대상 요소 앞에 추가
// cheerio.add('<li>새 항목</li>', '.apple', 'before');

// //---

// // 함수 직접 사용
// const $ = cheerio.load(html);

// // div를 section으로 변경
// retag($, 'div.content', 'section');

// // p를 h2로 변경
// retag($, 'p.title', 'h2');

// // Cheer 클래스 사용
// const cheerio = new Cheer(html);

// // div를 article로 변경
// cheerio.retag('div.post', 'article');

// // span을 strong으로 변경
// cheerio.retag('span.highlight', 'strong');
