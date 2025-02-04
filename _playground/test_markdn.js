import { mdContent, mdFrontmatter } from '../esm/markdn.js';

// 기본 HTML -> Markdown 변환 테스트
const testBasicConversion = () => {
  const html = `
    <h1>제목</h1>
    <p>일반 텍스트</p>
    <ul>
      <li>항목 1</li>
      <li>항목 2</li>
    </ul>
    <pre><code>const code = 'test';</code></pre>
  `;

  console.log('=== 기본 변환 테스트 ===');
  console.log(mdContent(html));
};

// Figure 태그 변환 테스트
const testFigureConversion = () => {
  const html = `
    <figure>
      <img src="image.jpg" alt="테스트 이미지">
      <figcaption>이미지 설명</figcaption>
    </figure>
  `;

  console.log('\n=== Figure 변환 테스트 ===');
  console.log(mdContent(html));
};

// 커스텀 설정 테스트
const testCustomConfig = () => {
  const html = `
    <h1>제목</h1>
    <ul>
      <li>항목 1</li>
      <li>항목 2</li>
    </ul>
  `;

  const customConfig = {
    headingStyle: 'setext',
    bulletListMarker: '*',
  };

  console.log('\n=== 커스텀 설정 테스트 ===');
  console.log(mdContent(html, customConfig));
};

// 커스텀 규칙 테스트
const testCustomRules = () => {
  const html = `
    <div class="custom">커스텀 내용</div>
  `;

  const customRules = {
    customDiv: {
      filter: 'div.custom',
      replacement: (content) => `:::custom\n${content}\n:::\n`,
    },
  };

  console.log('\n=== 커스텀 규칙 테스트 ===');
  console.log(mdContent(html, customRules));
};

// 복합 테스트
const testComplexConversion = () => {
  const html = `
    <article>
      <h1>블로그 포스트</h1>
      <p>이것은 <strong>강조된</strong> 텍스트입니다.</p>
      <figure>
        <img src="blog-image.jpg" alt="블로그 이미지">
        <figcaption>블로그 대표 이미지</figcaption>
      </figure>
      <h2>코드 예제</h2>
      <pre><code class="language-javascript">   console.log('Hello World');</code></pre>
      <ul>
        <li>첫 번째 항목</li>
        <li>두 번째 항목</li>
      </ul>
    </article>
  `;

  console.log('\n=== 복합 변환 테스트 ===');
  console.log(mdContent(html));
};

// 모든 테스트 실행
const runAllTests = () => {
  testBasicConversion();
  testFigureConversion();
  testCustomConfig();
  testCustomRules();
  testComplexConversion();
};

// // 테스트 실행
// runAllTests();

const properties = {
  title: '제목"test"',
  date: '2025-02-03',
  count: 10,
  tags: ['태그1', '태그2'],
};
console.log(mdFrontmatter(properties));
