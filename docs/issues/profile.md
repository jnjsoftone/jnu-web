 /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src/chrome.ts 는 selenium 기반으로 되어 있어요.

playwright를 사용한 동일 기능의 코드를  /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src/playwright-chrome.ts 에 생성해주세요.

```sh
cd /exposed/projects/jnj-custom-packages/npmjs/jnu-web && npm install playwright
```

===

 /exposed/projects/jnj-test/nodejs/js/web 에 /exposed/projects/jnj-test/nodejs/js/web/chrome-test.js 와 동일 기능의 playwright-chrome.ts를 사용하는 playwright-test.js를 생성해주세요.

 ===

 로그인되지 않은 상태라고 나오는데, 프로필 계정에 대한 로그인이 
  되지 않은 건가요?

● 네, 맞습니다. 프로필이 발견되었지만 실제로는 로그인이 적용되지
   않은 상태입니다.

  로그 메시지를 보면:
  이메일 bigwhitekmc@gmail.com의 프로필: Profile 39
  Profile settings skipped in container environment for
  stability

  문제 원인:
  1. 컨테이너 환경 제한: Profile settings skipped in container 
  environment for stability 메시지가 반복적으로 나타나는 것으로
  보아, Docker 컨테이너 환경에서는 안정성을 위해 프로필 설정이
  자동으로 스킵되고 있습니다.
  2. 프로필 적용 안됨: 프로필을 찾았지만 실제 브라우저 실행
  시에는 해당 프로필이 적용되지 않아서 로그인 상태가 유지되지
  않았습니다.

  해결 방법:
  프로필을 강제로 사용하려면 환경변수를 설정하면 됩니다:

  FORCE_CHROME_PROFILE=true node playwright-test.js

  이렇게 하면 컨테이너 환경에서도 프로필 설정이 적용되어 로그인
  상태를 유지할 수 있습니다. 다만 컨테이너 환경에서는 권한
  문제나 파일 시스템 접근 제한으로 인해 불안정할 수 있습니다.

---

/exposed/projects/jnj-custom-packages/npmjs/jnu-web/src/playwright-chrome-profile.ts, /exposed/projects/jnj-custom-packages/npmjs/jnu-web/src/selenium-chrome-profile.ts 파일에서 

CHROMIUM_EXECUTABLE_PATH, CHROMIUM_USERDATA_PATH 를 활용하도록 해주세요.

CHROMIUM_EXECUTABLE_PATH 는 실행파일 경로이며
CHROMIUM_USERDATA_PATH 는 프로필의 부모 디렉토리 경로입니다.

상단의 const 선언부 외에는 process.env.CHROMIUM_EXECUTABLE_PATH => CHROMIUM_EXECUTABLE_PATH 로 교체해주세요.

---

getPlaywrightChromeProfileByEmail , getSeleniumChromeProfileByEmail 함수에서는 
- email = ''인 경우는 디폴트 프로필 경로(예: CHROMIUM_USERDATA_PATH + '/Default')로 
- userDataDir = '' 인 경우는 디폴트 경로 userDataDir =  CHROMIUM_USERDATA_PATH 를 사용하도록 해주세요.
- 불필요한 코드들은 제거해주세요.

---


getPlaywrightChromeProfileByEmail = (email = '', userDataDir = '')

getSeleniumChromeProfileByEmail = (email = '', userDataDir = '')

====

## macos ~/.zshrc

```
export CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export CHROMIUM_USERDATA_PATH="/Users/youchan/Library/Application Support/Google/Chrome"
```


 /exposed/projects/jnj-custom-packages/npmjs/jnu-web 에서 ./publish.sh 를 실행시키면, 테스트 코드를 실행시키고, 에러가 발생하면 publish를 시키지 않네요. 테스트 코드 실행없이 publish를 하도록 하려면?

---

'/exposed/projects/jnj-custom-packages/npmjs/jnu-web/examples/Profile 39', '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/Profile 39', '/exposed/projects/jnj-custom-packages/npmjs/jnu-web/undefined' 등 크롬 프로필 폴더/파일들이 생성되고, 제거되지 않네요?

===

```sh
cd /exposed/projects/jnj-custom-packages/npmjs/jnu-web/examples && node profile.js

email로 프로필을 찾는 기능이 제대로 되지 않네요. 이전에는 작동했었어요. CHROMIUM_USERDATA_PATH를 환경변수에서 읽어오지 못하고 있나요? 'bigwhitekmc@gmail.com'

cd /exposed/projects/jnj-custom-packages/npmjs/jnu-web/examples && node profile.js
playwright null
selenium null


const CHROMIUM_USERDATA_PATH = process.env.CHROMIUM_USERDATA_PATH





cd /exposed/projects/jnj-custom-packages/npmjs/jnu-web

./publish.sh --auto-commit --skip-tests -m "docker ubuntu 환경에서 운영 playwright"
```