import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// 운영체제에 따라 ChromeDriver 경로 설정
const isWindows = os.platform() === 'win32';
let CHROMEDRIVER_PATH;

if (isWindows) {
  // Windows 환경에서는 node_modules에서 ChromeDriver를 찾거나 직접 다운로드 받은 경로 사용
  CHROMEDRIVER_PATH =
    process.env.CHROMEDRIVER_PATH || path.join(process.cwd(), 'node_modules', '.bin', 'chromedriver.exe');
} else {
  // Linux/Docker 환경
  CHROMEDRIVER_PATH = process.env.CHROMEDRIVER_PATH || '/usr/bin/chromedriver';
}

/**
 * 게시판 목록 페이지 스크래핑
 */
export const fetchListPages = async (names, save = true) => {
  const options = new chrome.Options();
  if (HEADLESS) {
    options.addArguments('--headless');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-setuid-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');

  // Chrome 경로 설정 (환경 변수가 있으면 사용)
  if (process.env.CHROME_BIN) {
    options.setChromeBinaryPath(process.env.CHROME_BIN);
  }

  console.log(`Operating System: ${os.platform()}`);
  console.log(`Using ChromeDriver at: ${CHROMEDRIVER_PATH}`);
  console.log(`Chrome binary path: ${process.env.CHROME_BIN || 'default'}`);

  // driver 변수를 try 블록 밖에서 선언
  let driver = null;

  try {
    // ChromeDriver 파일이 존재하는지 확인
    if (!fs.existsSync(CHROMEDRIVER_PATH)) {
      console.error(`ChromeDriver not found at: ${CHROMEDRIVER_PATH}`);
      console.log('Please install ChromeDriver or set the correct path.');

      if (isWindows) {
        console.log('For Windows, you can install ChromeDriver using:');
        console.log('npm install -g chromedriver');
        console.log('Or download from: https://chromedriver.chromium.org/downloads');
      }

      throw new Error(`ChromeDriver not found at: ${CHROMEDRIVER_PATH}`);
    }

    // 최신 Selenium WebDriver API에 맞게 수정
    const service = new chrome.ServiceBuilder(CHROMEDRIVER_PATH);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service) // 서비스 설정 방법 변경
      .build();

    console.log('='.repeat(80));
    console.log(`@@@@@ Scrape Notices At: ${now()}`);
    console.log('-'.repeat(80));

    let processedCount = 0;
    let errorCount = 0;

    for (const [nth, name] of names.entries()) {
      let isError = false;
      console.log(`### ${name} (${nth})@fetch_list_pages`);

      try {
        const config = await noticeConfigByName(name);
        if (!config) {
          console.error(`설정을 찾을 수 없습니다: ${name}`);
          errorCount++;
          continue;
        }

        const [url, iframe, rowXpath, paging, startPage, endPage, login, elements] = config;

        if (!url || !rowXpath || !elements || Object.keys(elements).length === 0) {
          console.error(`필수 설정이 누락되었습니다: ${name}`);
          console.error('url:', url);
          console.error('rowXpath:', rowXpath);
          console.error('elements:', JSON.stringify(elements, null, 2));
          errorCount++;
          continue;
        }

        // 초기 페이지 로딩
        try {
          await driver.get(url.replace('${i}', startPage.toString()));
          await driver.wait(until.elementLocated(By.xpath(rowXpath)), 120000);
        } catch (e) {
          console.error(`초기 페이지 로딩 실패: ${e.message}`);
          errorCount++;
          continue;
        }

        let pageProcessedCount = 0;
        let pageErrorCount = 0;

        for (let i = startPage; i <= endPage; i++) {
          console.log(`@@@ Processing page: ${i}`);

          try {
            // iframe 처리
            if (iframe) {
              try {
                await driver.wait(until.elementLocated(By.css(iframe)), 60000);
                await driver.switchTo().frame(await driver.findElement(By.css(iframe)));
              } catch (e) {
                console.error(`iframe 전환 실패: ${e.message}`);
                pageErrorCount++;
                continue;
              }
            }

            try {
              await driver.wait(until.elementLocated(By.xpath(rowXpath)), 60000);
            } catch (e) {
              console.error(`행 요소를 찾을 수 없습니다: ${e.message}`);
              pageErrorCount++;

              // iframe에서 메인 프레임으로 복귀
              if (iframe) {
                try {
                  await driver.switchTo().defaultContent();
                } catch (frameError) {
                  console.error(`기본 프레임으로 복귀 실패: ${frameError.message}`);
                }
              }

              continue;
            }

            let html = '';
            try {
              html = await driver.getPageSource();
            } catch (e) {
              console.error(`페이지 소스 가져오기 실패: ${e.message}`);
              pageErrorCount++;

              // iframe에서 메인 프레임으로 복귀
              if (iframe) {
                try {
                  await driver.switchTo().defaultContent();
                } catch (frameError) {
                  console.error(`기본 프레임으로 복귀 실패: ${frameError.message}`);
                }
              }

              continue;
            }

            // iframe에서 메인 프레임으로 복귀
            if (iframe) {
              try {
                await driver.switchTo().defaultContent();
              } catch (e) {
                console.error(`기본 프레임으로 복귀 실패: ${e.message}`);
                pageErrorCount++;
                continue;
              }
            }

            let data = [];
            try {
              data = getRows(html, rowXpath, elements);
              console.log(`@@@ Extracted data count: ${data.length}`);

              if (data.length === 0) {
                console.log('더 이상 데이터가 없습니다. 페이지 처리를 종료합니다.');
                break;
              }
            } catch (e) {
              console.error(`데이터 추출 실패: ${e.message}`);
              pageErrorCount++;
              continue;
            }

            // 데이터 처리
            for (const item of data) {
              item.기관명 = name;
              item.scraped_at = now();
            }

            if (save) {
              try {
                const csv = csvFromDicts(data);
                if (csv.length > 0) {
                  await insertListData(csv);
                  pageProcessedCount++;
                }
              } catch (e) {
                console.error(`데이터 저장 실패: ${e.message}`);
                pageErrorCount++;
                continue;
              }
            } else {
              pageProcessedCount++;
            }

            // 다음 페이지로 이동
            if (i < endPage) {
              try {
                if (url.includes('${i}')) {
                  await driver.get(url.replace('${i}', (i + 1).toString()));
                } else {
                  const nextPageXPath = paging.replace('${i}', (i + 1).toString());
                  await driver.wait(until.elementLocated(By.xpath(nextPageXPath)), 60000);
                  await driver.findElement(By.xpath(nextPageXPath)).click();
                  await driver.sleep(1000);
                }
              } catch (e) {
                console.error(`다음 페이지로 이동 실패: ${e.message}`);
                pageErrorCount++;
                break;
              }
            }
          } catch (e) {
            console.error(`페이지 ${i} 처리 중 오류 발생: ${e.message}`);
            pageErrorCount++;
            isError = true;
            break;
          }
        }

        console.log(`### ${name} 처리 완료: 성공 ${pageProcessedCount}페이지, 오류 ${pageErrorCount}페이지`);
        processedCount++;
      } catch (e) {
        console.error(`${name} 처리 중 오류 발생: ${e.message}`);
        errorCount++;
      }
    }

    console.log('='.repeat(80));
    console.log(`스크래핑 완료: 성공 ${processedCount}개 기관, 오류 ${errorCount}개 기관`);
    console.log('='.repeat(80));
  } finally {
    // driver가 null이 아닌 경우에만 quit 호출
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        console.error(`Error quitting driver: ${e.message}`);
      }
    }
  }
};

// * 테스트 코드
const main = async () => {
  try {
    const names = ['성동구'];
    await fetchListPages(names, false);
    console.log('스크래핑이 성공적으로 완료되었습니다.');
  } catch (e) {
    console.error('Error in main:', e);
  } finally {
    try {
      await mysql.close();
      console.log('데이터베이스 연결이 닫혔습니다.');
    } catch (e) {
      console.error('Error closing database connection:', e);
    } finally {
      console.log('프로그램을 종료합니다.');
      process.exit(0); // 프로세스 명시적 종료
    }
  }
};

// 예기치 않은 오류 처리
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
