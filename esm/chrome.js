function e(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}import{Builder as t,By as i}from"selenium-webdriver";import a from"selenium-webdriver/chrome.js";import{loadJson as n,findFolders as r,saveFile as s,sleepAsync as l}from"jnu-abc";import{until as o}from"selenium-webdriver";let c=(e="",t="")=>{if(!t)return null;for(let i of r(t,"Profile")){let t=n(`${i}/Preferences`);if(t.account_info&&t.account_info.length>0&&t.account_info[0].email===e)return i.replace(/\\/g,"/").split("/").pop()||null}return null};class d{async getFullSize(){let e=0,t=0;for(;;){let{viewportHeight:i,documentHeight:a,scrollY:n}=await this.driver.executeScript(`
        return {
          viewportHeight: window.innerHeight,
          documentHeight: Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          ),
          scrollY: window.scrollY || window.pageYOffset
        }
      `);if(a===e){if(++t>=3)break}else t=0,e=a;let r=Math.min(n+800,a-i);if(n>=a-i)break;await this.driver.executeScript(`window.scrollTo(0, ${r})`),await this.driver.sleep(2e3),await this.driver.wait(async()=>await this.driver.executeScript(`
          return Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          )
        `)>=a,3e3).catch(()=>{})}return await this.driver.executeScript(`
      return {
        width: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
          document.documentElement.offsetWidth,
          document.body.offsetWidth
        ),
        height: Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        )
      }
    `)}async _getFullScreenshot(){try{let{width:e,height:t}=await this.getFullSize();return await this.driver.manage().window().setRect({width:e,height:t}),await this.driver.takeScreenshot()}catch(e){throw console.error("스크린샷 촬영 중 오류 발생:",e),e}}async getFullScreenshot(){try{return await this._getFullScreenshot()}finally{this.close()}}async saveScreenshot(e){try{let t=await this._getFullScreenshot();s(e,t,{encoding:"base64"})}finally{this.close()}}async goto(e){await this.driver.get(e)}async wait(e,t={}){let{timeout:a=1e4,until:n="located"}=t;switch(n){case"clickable":return this.driver.wait(o.elementIsEnabled(await this.findElement(e)),a);case"visible":return this.driver.wait(o.elementIsVisible(await this.findElement(e)),a);case"invisible":return this.driver.wait(o.elementIsNotVisible(await this.findElement(e)),a);case"staleness":return this.driver.wait(o.stalenessOf(await this.findElement(e)),a);default:return this.driver.wait(o.elementLocated(i.css(e)),a)}}async _findElements(e,t){switch(e.toLowerCase()){case"id":return await this.driver.findElements(i.id(t));case"name":return await this.driver.findElements(i.name(t));case"css":return await this.driver.findElements(i.css(t));case"xpath":return await this.driver.findElements(i.xpath(t));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElements(e){return await this.driver.findElements(i.css(e))}async _findElement(e,t){switch(e.toLowerCase()){case"id":return await this.driver.findElement(i.id(t));case"name":return await this.driver.findElement(i.name(t));case"css":return await this.driver.findElement(i.css(t));case"xpath":return await this.driver.findElement(i.xpath(t));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElement(e){return await this.driver.findElement(i.css(e))}async getPageSource(){return await this.driver.getPageSource()}async _getElementHtml(e,t){let i=await this._findElement(e,t);return await i.getAttribute("outerHTML")}async getElementHtml(e){return await (await this.findElement(e)).getAttribute("outerHTML")}async _click(e,t){let i=await this._findElement(e,t);await i.click()}async click(e){let t=await this.findElement(e);await this.scrollIntoView(t),await l(1e3),await t.click()}async _getText(e,t){let i=await this._findElement(e,t);return await i.getText()}async getText(e){let t=await this.findElement(e);return await t.getText()}async _getAttribute(e,t,i){let a=await this._findElement(e,t);return await a.getAttribute(i)}async getAttribute(e,t){let i=await this.findElement(e);return await i.getAttribute(t)}async _sendKeys(e,t,i){let a=await this._findElement(e,t);await a.sendKeys(i)}async sendKeys(e,t){let i=await this.findElement(e);await i.sendKeys(t)}async _saveElementScreenshot(e,t,i){let a=await this._findElement(e,t);s(i,await a.takeScreenshot(),{encoding:"base64"})}async saveElementScreenshot(e,t){let i=await this.findElement(e);s(t,await i.takeScreenshot(),{encoding:"base64"})}async executeScript(e,...t){return this.driver.executeScript(e,...t)}async scrollIntoView(e){await this.executeScript("arguments[0].scrollIntoView(true);",e)}async close(){await this.driver.quit()}constructor(i={headless:!1,profileName:"",email:"",userDataDir:"",arguments:[]}){e(this,"driver",void 0);let n=new a.Options;i.headless&&n.addArguments("--headless=new");let r=i.profileName??c(i.email,i.userDataDir)??null;r&&(n.addArguments(`--user-data-dir=${i.userDataDir}`),n.addArguments(`--profile-directory=${r}`)),["--disable-gpu","--no-sandbox","--disable-dev-shm-usage","--disable-blink-features=AutomationControlled","--disable-extensions","--start-maximized","--window-size=1920,1080","--disable-web-security","--allow-running-insecure-content","--disable-popup-blocking","--disable-notifications","--disable-infobars","--ignore-certificate-errors","--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",...i.arguments||[]].forEach(e=>n.addArguments(e)),n.excludeSwitches("enable-automation"),n.excludeSwitches("enable-logging"),n.setUserPreferences({credentials_enable_service:!1,"profile.password_manager_enabled":!1,useAutomationExtension:!1,excludeSwitches:["enable-automation"],"profile.default_content_setting_values.notifications":2,"profile.managed_default_content_settings.images":1,"profile.default_content_settings.popups":0}),this.driver=new t().forBrowser("chrome").setChromeOptions(n).build(),this.driver.executeScript(`
      // navigator.webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome 자동화 관련 속성 제거
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    `)}}class u{async initializeDriver(e){this.driver=await new t().forBrowser("chrome").setChromeOptions(e).build()}async goto(e){await this.driver.get(e)}async close(){await this.driver.quit()}constructor(t={headless:!1,arguments:[]}){e(this,"driver",void 0);let i=new a.Options;t.headless&&i.addArguments("--headless=new"),["--disable-gpu","--no-sandbox","--disable-dev-shm-usage",...t.arguments||[]].forEach(e=>i.addArguments(e)),this.initializeDriver(i)}}export{d as Chrome,u as ChromeBasic,c as getProfileByEmail};