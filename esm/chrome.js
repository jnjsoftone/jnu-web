import{Builder as e,By as t}from"selenium-webdriver";import i from"selenium-webdriver/chrome.js";import{loadJson as a,findFolders as n,saveFile as r,sleepAsync as s}from"jnu-abc";import{until as l}from"selenium-webdriver";let o=(e="",t="")=>{if(!t)return null;for(let i of n(t,"Profile")){let t=a(`${i}/Preferences`);if(t.account_info&&t.account_info.length>0&&t.account_info[0].email===e)return i.replace(/\\/g,"/").split("/").pop()||null}return null};class c{async getFullSize(){let e=0,t=0;for(;;){let{viewportHeight:i,documentHeight:a,scrollY:n}=await this.driver.executeScript(`
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
      `);if(a===e){if(++t>=3)break}else t=0,e=a;let r=Math.min(n+800,a-i);if(n>=a-i)break;await this.driver.executeScript(`window.scrollTo(0, ${r})`),await this.driver.sleep(1e3),await this.driver.wait(async()=>await this.driver.executeScript(`
          return Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.offsetHeight
          )
        `)>=a,2e3).catch(()=>{})}return await this.driver.executeScript(`
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
    `)}async _getFullScreenshot(){try{let{width:e,height:t}=await this.getFullSize();return await this.driver.manage().window().setRect({width:e,height:t}),await this.driver.takeScreenshot()}catch(e){throw console.error("스크린샷 촬영 중 오류 발생:",e),e}}async getFullScreenshot(){try{return await this._getFullScreenshot()}finally{this.close()}}async saveScreenshot(e){try{let t=await this._getFullScreenshot();r(e,t,{encoding:"base64"})}finally{this.close()}}async goto(e){await this.driver.get(e)}async wait(e,i={}){let{timeout:a=1e4,type:n="located"}=i;switch(n){case"clickable":return this.driver.wait(l.elementIsEnabled(await this.findElement(e)),a);case"visible":return this.driver.wait(l.elementIsVisible(await this.findElement(e)),a);case"invisible":return this.driver.wait(l.elementIsNotVisible(await this.findElement(e)),a);case"staleness":return this.driver.wait(l.stalenessOf(await this.findElement(e)),a);default:return this.driver.wait(l.elementLocated(t.css(e)),a)}}async _findElements(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElements(t.id(i));case"name":return await this.driver.findElements(t.name(i));case"css":return await this.driver.findElements(t.css(i));case"xpath":return await this.driver.findElements(t.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElements(e){return await this.driver.findElements(t.css(e))}async _findElement(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElement(t.id(i));case"name":return await this.driver.findElement(t.name(i));case"css":return await this.driver.findElement(t.css(i));case"xpath":return await this.driver.findElement(t.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElement(e){return await this.driver.findElement(t.css(e))}async getPageSource(){return await this.driver.getPageSource()}async _getElementHtml(e,t){let i=await this._findElement(e,t);return await i.getAttribute("outerHTML")}async getElementHtml(e){return await (await this.findElement(e)).getAttribute("outerHTML")}async _click(e,t){let i=await this._findElement(e,t);await i.click()}async click(e){let t=await this.findElement(e);await this.scrollIntoView(t),await s(1e3),await t.click()}async _getText(e,t){let i=await this._findElement(e,t);return await i.getText()}async getText(e){let t=await this.findElement(e);return await t.getText()}async _getAttribute(e,t,i){let a=await this._findElement(e,t);return await a.getAttribute(i)}async getAttribute(e,t){let i=await this.findElement(e);return await i.getAttribute(t)}async _sendKeys(e,t,i){let a=await this._findElement(e,t);await a.sendKeys(i)}async sendKeys(e,t){let i=await this.findElement(e);await i.sendKeys(t)}async _saveElementScreenshot(e,t,i){let a=await this._findElement(e,t);r(i,await a.takeScreenshot(),{encoding:"base64"})}async saveElementScreenshot(e,t){let i=await this.findElement(e);r(t,await i.takeScreenshot(),{encoding:"base64"})}async executeScript(e,...t){return this.driver.executeScript(e,...t)}async scrollIntoView(e){await this.executeScript("arguments[0].scrollIntoView(true);",e)}async close(){await this.driver.quit()}constructor(t={headless:!1,profileName:"",email:"",userDataDir:"",arguments:[]}){var a,n;n=void 0,(a="driver")in this?Object.defineProperty(this,a,{value:n,enumerable:!0,configurable:!0,writable:!0}):this[a]=n;let r=new i.Options;t.headless&&r.addArguments("--headless=new");let s=t.profileName??o(t.email,t.userDataDir)??null;s&&(r.addArguments(`--user-data-dir=${t.userDataDir}`),r.addArguments(`--profile-directory=${s}`)),["--disable-gpu","--no-sandbox","--disable-dev-shm-usage","--disable-blink-features=AutomationControlled","--disable-extensions","--start-maximized","--window-size=1920,1080","--disable-web-security","--allow-running-insecure-content","--disable-popup-blocking","--disable-notifications","--disable-infobars","--ignore-certificate-errors","--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",...t.arguments||[]].forEach(e=>r.addArguments(e)),r.excludeSwitches("enable-automation"),r.excludeSwitches("enable-logging"),r.setUserPreferences({credentials_enable_service:!1,"profile.password_manager_enabled":!1,useAutomationExtension:!1,excludeSwitches:["enable-automation"],"profile.default_content_setting_values.notifications":2,"profile.managed_default_content_settings.images":1,"profile.default_content_settings.popups":0}),this.driver=new e().forBrowser("chrome").setChromeOptions(r).build(),this.driver.executeScript(`
      // navigator.webdriver 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Chrome 자동화 관련 속성 제거
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    `)}}export{c as Chrome,o as getProfileByEmail};