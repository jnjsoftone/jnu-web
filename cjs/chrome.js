"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0}),!function(e,t){for(var i in t)Object.defineProperty(e,i,{enumerable:!0,get:t[i]})}(exports,{Chrome:function(){return r},getProfileByEmail:function(){return a}});const t=require("selenium-webdriver"),i=(e=require("selenium-webdriver/chrome.js"))&&e.__esModule?e:{default:e},n=require("jnu-abc"),a=(e="",t="")=>{if(!t)return null;for(let i of(0,n.findFolders)(t,"Profile")){let t=(0,n.loadJson)(`${i}/Preferences`);if(t.account_info&&t.account_info.length>0&&t.account_info[0].email===e)return i.replace(/\\/g,"/").split("/").pop()||null}return null};class r{async getFullSize(){let e=0,t=0;for(;;){let{viewportHeight:i,documentHeight:n,scrollY:a}=await this.driver.executeScript(`
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
      `);if(n===e){if(++t>=3)break}else t=0,e=n;let r=Math.min(a+800,n-i);if(a>=n-i)break;await this.driver.executeScript(`window.scrollTo(0, ${r})`),await this.driver.sleep(1e3),await this.driver.wait(async()=>await this.driver.executeScript(`
          return Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          )
        `)>=n,2e3).catch(()=>{})}return await this.driver.executeScript(`
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
    `)}async _getFullScreenshot(){try{let{width:e,height:t}=await this.getFullSize();return await this.driver.manage().window().setRect({width:e,height:t}),await this.driver.takeScreenshot()}catch(e){throw console.error("스크린샷 촬영 중 오류 발생:",e),e}}async getFullScreenshot(){try{return await this._getFullScreenshot()}finally{this.close()}}async saveScreenshot(e){try{let t=await this._getFullScreenshot();(0,n.saveFile)(e,t,{encoding:"base64"})}finally{this.close()}}async goto(e){await this.driver.get(e)}async wait(e,i={}){let{timeout:n=1e4,type:a="located"}=i;switch(a){case"clickable":return this.driver.wait(t.until.elementIsEnabled(await this.findElement(e)),n);case"visible":return this.driver.wait(t.until.elementIsVisible(await this.findElement(e)),n);case"invisible":return this.driver.wait(t.until.elementIsNotVisible(await this.findElement(e)),n);case"staleness":return this.driver.wait(t.until.stalenessOf(await this.findElement(e)),n);default:return this.driver.wait(t.until.elementLocated(t.By.css(e)),n)}}async _findElements(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElements(t.By.id(i));case"name":return await this.driver.findElements(t.By.name(i));case"css":return await this.driver.findElements(t.By.css(i));case"xpath":return await this.driver.findElements(t.By.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElements(e){return await this.driver.findElements(t.By.css(e))}async _findElement(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElement(t.By.id(i));case"name":return await this.driver.findElement(t.By.name(i));case"css":return await this.driver.findElement(t.By.css(i));case"xpath":return await this.driver.findElement(t.By.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElement(e){return await this.driver.findElement(t.By.css(e))}async getPageSource(){return await this.driver.getPageSource()}async _getElementHtml(e,t){let i=await this._findElement(e,t);return await i.getAttribute("outerHTML")}async getElementHtml(e){return await (await this.findElement(e)).getAttribute("outerHTML")}async _click(e,t){let i=await this._findElement(e,t);await i.click()}async click(e){let t=await this.findElement(e);await this.scrollIntoView(t),await (0,n.sleepAsync)(1e3),await t.click()}async _getText(e,t){let i=await this._findElement(e,t);return await i.getText()}async getText(e){let t=await this.findElement(e);return await t.getText()}async _getAttribute(e,t,i){let n=await this._findElement(e,t);return await n.getAttribute(i)}async getAttribute(e,t){let i=await this.findElement(e);return await i.getAttribute(t)}async _sendKeys(e,t,i){let n=await this._findElement(e,t);await n.sendKeys(i)}async sendKeys(e,t){let i=await this.findElement(e);await i.sendKeys(t)}async _saveElementScreenshot(e,t,i){let a=await this._findElement(e,t),r=await a.takeScreenshot();(0,n.saveFile)(i,r,{encoding:"base64"})}async saveElementScreenshot(e,t){let i=await this.findElement(e),a=await i.takeScreenshot();(0,n.saveFile)(t,a,{encoding:"base64"})}async executeScript(e,...t){return this.driver.executeScript(e,...t)}async scrollIntoView(e){await this.executeScript("arguments[0].scrollIntoView(true);",e)}async close(){await this.driver.quit()}constructor(e={headless:!1,profileName:"",email:"",userDataDir:"",arguments:[]}){var n,r;r=void 0,(n="driver")in this?Object.defineProperty(this,n,{value:r,enumerable:!0,configurable:!0,writable:!0}):this[n]=r;let s=new i.default.Options;e.headless&&s.addArguments("--headless=new");let l=e.profileName??a(e.email,e.userDataDir)??null;l&&(s.addArguments(`--user-data-dir=${e.userDataDir}`),s.addArguments(`--profile-directory=${l}`)),["--disable-gpu","--no-sandbox","--disable-dev-shm-usage","--disable-blink-features=AutomationControlled","--disable-extensions","--start-maximized","--window-size=1920,1080","--disable-web-security","--allow-running-insecure-content","--disable-popup-blocking","--disable-notifications","--disable-infobars","--ignore-certificate-errors","--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",...e.arguments||[]].forEach(e=>s.addArguments(e)),s.excludeSwitches("enable-automation"),s.excludeSwitches("enable-logging"),s.setUserPreferences({credentials_enable_service:!1,"profile.password_manager_enabled":!1,useAutomationExtension:!1,excludeSwitches:["enable-automation"],"profile.default_content_setting_values.notifications":2,"profile.managed_default_content_settings.images":1,"profile.default_content_settings.popups":0}),this.driver=new t.Builder().forBrowser("chrome").setChromeOptions(s).build(),this.driver.executeScript(`
      // navigator.webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome 자동화 관련 속성 제거
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    `)}}