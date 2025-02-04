import { Cheer } from '../esm/cheer.js';

// * value, json, jsons
// 테스트용 HTML
const testHtml = `
<div class="container">
  <div class="profile">
    <h1 class="name">홍길동</h1>
    <p class="age">30</p>
    <img class="avatar" src="profile.jpg" alt="프로필 사진">
  </div>
  <div class="posts">
    <article class="post">
      <h2 class="title">첫 번째 글</h2>
      <p class="content">안녕하세요</p>
      <span class="date">2024-03-20</span>
    </article>
    <article class="post">
      <h2 class="title">두 번째 글</h2>
      <p class="content">반갑습니다</p>
      <span class="date">2024-03-21</span>
    </article>
  </div>
</div>
`;

const cheer = new Cheer(testHtml);

// value 테스트
console.log('=== value 테스트 ===');
console.log('이름:', cheer.value('.name'));
console.log('나이:', cheer.value('.age'));
console.log('프로필 이미지 src:', cheer.value('.avatar', 'src'));
console.log('프로필 이미지 alt:', cheer.value('.avatar', 'alt'));

// json 테스트
console.log('\n=== json 테스트 ===');
const profileSettings = [
  { key: 'name', selector: '.name' },
  { key: 'age', selector: '.age' },
  { key: 'avatar', selector: '.avatar', attribute: 'src' },
];
console.log('프로필 정보:', cheer.json(profileSettings));

const contentCallback = (value) => `내용~~~: ${value.trim()}`;

// jsons 테스트
console.log('\n=== jsons 테스트 ===');
const postSettings = [
  { key: 'title', selector: '.title', callback: (value) => `제목: ${value.trim()}` },
  { key: 'content', selector: '.content', callback: contentCallback },
  { key: 'date', selector: '.date', callback: (value) => `날짜: ${value.trim()}` },
];

const posts = cheer.jsons(cheer.find('.posts .post'), postSettings);
console.log('게시글 목록:', posts);

// // callback 사용 예제
// console.log('\n=== callback 테스트 ===');
// const settingsWithCallback = [
//   {
//     key: 'age',
//     selector: '.age',
//     callback: (value) => parseInt(value), // 문자열을 숫자로 변환
//   },
// ];
// console.log('콜백 처리된 나이:', cheer.json(settingsWithCallback));

// // * add, retag, del
// const html = '<html><body><div class="target"></div></body></html>';
// const cheerTest = new Cheer(html);

// cheerTest.add('<div>새로운 요소</div>', '.target', 'after');
// console.log(cheerTest.html('html'));
// cheerTest.retag('div.target', 'section');
// console.log(cheerTest.html('html'));
// cheerTest.del('section');
// console.log(cheerTest.html('html'));
