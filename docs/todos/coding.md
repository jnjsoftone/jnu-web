
 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src 에 있는 함수들의 이름을 보다 직관적으로 변경하려고 해요. 관련 파일들(index.ts, tests 폴더 등 포함)을 수정해주세요

- playwright-chrome-profile.ts
  - getProfileByEmail => getPlaywrightChromeProfileByEmail

- selenium-chrome-profile.ts
  - getProfileByEmail => getSeleniumChromeProfileByEmail

- selenium-chrome-basic.ts
  - goChrome => gotoBySeleniumBasic

---
 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src 에
selenium-chrome-basic.ts 에 해당하는 playwright 용 코드 playwright-chrome-basic.ts 를 생성하고, index.ts에 반영해주세요.

===

 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests 폴더에 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src 에 있는 파일/클래스/함수 들에 대한 테스트 코드를 만들고, 테스트를 진행해주세요.

 ===

 수동으로 각 test들을 실행하는 방법은?

  `npm test tests/unit/selenium-chrome-profile.test.ts`, `npm test tests/unit/playwright-chrome-profile.test.ts` 를 실행하면 full screenshot를 찍는데, 이 이미지 파일을 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/unit/downloads 디렉토리에 저장하도록 해주세요.

  getPlaywrightChromeProfileByEmail 등 입력값이나 최종 결과나 중간 결과가 있는 경우, 그 값들을 테스트 콘솔에서 확인할 수 있도록 해주세요.