// 함수 직접 사용
const $ = cheerio.load(html);
addElement($, '<div>새로운 요소</div>', '.target', 'after');

// Cheerio 클래스 사용
const cheerio = new Cheerio(html);

// 대상 요소 뒤에 추가
cheerio.add('<li>새 항목</li>', '.apple', 'after');

// 대상 요소 앞에 추가
cheerio.add('<li>새 항목</li>', '.apple', 'before');

// 대상 요소의 마지막 자식으로 추가
cheerio.add('<li>새 항목</li>', 'ul', 'append');

// 대상 요소의 첫 번째 자식으로 추가
cheerio.add('<li>새 항목</li>', 'ul', 'prepend');


// ---

// 함수 직접 사용
const $ = cheerio.load(html);

// 대상 요소의 자식으로 추가 (기본값)
addElement($, '<li>새 항목</li>', 'ul');
// 또는
addElement($, '<li>새 항목</li>', 'ul', 'append');

// 대상 요소 앞에 추가
addElement($, '<li>새 항목</li>', '.apple', 'before');

// Cheerio 클래스 사용
const cheerio = new Cheerio(html);

// 대상 요소의 자식으로 추가 (기본값)
cheerio.add('<li>새 항목</li>', 'ul');
// 또는
cheerio.add('<li>새 항목</li>', 'ul', 'append');

// 대상 요소 앞에 추가
cheerio.add('<li>새 항목</li>', '.apple', 'before');

//---

// 함수 직접 사용
const $ = cheerio.load(html);

// 대상 요소 뒤에 추가 (기본값)
addElement($, '<li>새 항목</li>', '.apple');
// 또는
addElement($, '<li>새 항목</li>', '.apple', 'after');

// 대상 요소 앞에 추가
addElement($, '<li>새 항목</li>', '.apple', 'before');

// Cheerio 클래스 사용
const cheerio = new Cheerio(html);

// 대상 요소 뒤에 추가 (기본값)
cheerio.add('<li>새 항목</li>', '.apple');
// 또는
cheerio.add('<li>새 항목</li>', '.apple', 'after');

// 대상 요소 앞에 추가
cheerio.add('<li>새 항목</li>', '.apple', 'before');

//---

// 함수 직접 사용
const $ = cheerio.load(html);

// div를 section으로 변경
retag($, 'div.content', 'section');

// p를 h2로 변경
retag($, 'p.title', 'h2');

// Cheerio 클래스 사용
const cheerio = new Cheerio(html);

// div를 article로 변경
cheerio.retag('div.post', 'article');

// span을 strong으로 변경
cheerio.retag('span.highlight', 'strong');