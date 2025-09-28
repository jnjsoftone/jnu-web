

## test

cd /exposed/projects/jnj-custom-packages/npmjs/jnu-web

1. 개별 테스트 파일 실행

# 특정 테스트 파일만 실행
npm test tests/unit/request.test.ts
npm test tests/unit/selenium-chrome-profile.test.ts
npm test tests/unit/playwright-chrome-profile.test.ts
npm test tests/unit/selenium-chrome-basic.test.ts
npm test tests/unit/playwright-chrome-basic.test.ts

2. 테스트 패턴으로 실행

# 파일명 패턴으로 실행
npm test -- --testPathPattern=request
npm test -- --testPathPattern=selenium
npm test -- --testPathPattern=playwright
npm test -- --testPathPattern=chrome-profile
npm test -- --testPathPattern=chrome-basic

3. 특정 테스트 케이스만 실행

# describe 블록 이름으로 실행
npm test -- --testNamePattern="Request Module"
npm test -- --testNamePattern="Selenium Chrome Profile Module"
npm test -- --testNamePattern="Playwright Chrome Profile Module"

# 특정 테스트 케이스만 실행
npm test -- --testNamePattern="should make a GET request"
npm test -- --testNamePattern="should initialize with headless mode"

4. 조합 사용

# 특정 파일의 특정 테스트만 실행
npm test tests/unit/request.test.ts -- --testNamePattern="reqGet"
npm test tests/unit/selenium-chrome-profile.test.ts --
--testNamePattern="getSeleniumChromeProfileByEmail"

5. Jest CLI 직접 사용

# Jest를 직접 실행
npx jest tests/unit/request.test.ts
npx jest tests/unit/selenium-chrome-profile.test.ts --testNamePattern="should find 
profile by email"

6. Watch 모드로 실행

# 파일 변경 감지해서 자동 재실행
npm test -- --watch tests/unit/request.test.ts
npm test -- --watchAll

7. 상세 정보와 함께 실행

# 더 자세한 출력
npm test -- --verbose tests/unit/request.test.ts
npm test -- --verbose --testNamePattern="reqPost"

예시: 특정 모듈별 테스트 실행

"""
`npm test tests/unit/selenium-chrome-profile.test.ts`, `npm test tests/unit/playwright-chrome-profile.test.ts` 를 실행하면 full screenshot를 찍는데, 이 이미지 파일을 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/unit/downloads 디렉토리에 저장하도록 해주세요.

다운로드 디렉토리의 경로를 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/tests/downloads 로 변경해주세요.

getPlaywrightChromeProfileByEmail 등 입력값이나 중간 결과, 최종 결과가 있는 경우, 그 값들을 테스트 콘솔에서 확인할 수 있도록 해주세요.


PlaywrightChromeProfile 같은 경우에도, 단계별 성공 여부만 체크하지 말고, 각 단계별 데이터의 흐름을 볼 수 있었으면 좋겠네요.
"""

`npm test tests/unit/playwright-chrome-profile.test.ts` 실햏했는데, 스크린샷이 저장되지 않았어요.