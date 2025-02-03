"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0}),!function(e,t){for(var i in t)Object.defineProperty(e,i,{enumerable:!0,get:t[i]})}(exports,{Chrome:function(){return a},getProfileByEmail:function(){return r}});const t=require("selenium-webdriver"),i=(e=require("selenium-webdriver/chrome.js"))&&e.__esModule?e:{default:e},n=require("jnu-abc"),r=(e="",t="")=>{if(!t)return null;for(let i of(0,n.findFolders)(t,"Profile")){let t=(0,n.loadJson)(`${i}/Preferences`);if(t.account_info&&t.account_info.length>0&&t.account_info[0].email===e)return i.replace(/\\/g,"/").split("/").pop()||null}return null};class a{async getFullSize(){let e=0,t=0;for(;;){let{viewportHeight:i,documentHeight:n,scrollY:r}=await this.driver.executeScript(`
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
      `);if(n===e){if(++t>=3)break}else t=0,e=n;let a=Math.min(r+800,n-i);if(r>=n-i)break;await this.driver.executeScript(`window.scrollTo(0, ${a})`),await this.driver.sleep(1e3),await this.driver.wait(async()=>await this.driver.executeScript(`
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
    `)}async _getFullScreenshot(){try{let{width:e,height:t}=await this.getFullSize();return await this.driver.manage().window().setRect({width:e,height:t}),await this.driver.takeScreenshot()}catch(e){throw console.error("스크린샷 촬영 중 오류 발생:",e),e}}async getFullScreenshot(){try{return await this._getFullScreenshot()}finally{this.close()}}async saveScreenshot(e){try{let t=await this._getFullScreenshot();(0,n.saveFile)(e,t,{encoding:"base64"})}finally{this.close()}}async goto(e){await this.driver.get(e)}async close(){await this.driver.quit()}async _findElements(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElements(t.By.id(i));case"name":return await this.driver.findElements(t.By.name(i));case"css":return await this.driver.findElements(t.By.css(i));case"xpath":return await this.driver.findElements(t.By.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElements(e){return await this.driver.findElements(t.By.css(e))}async _findElement(e,i){switch(e.toLowerCase()){case"id":return await this.driver.findElement(t.By.id(i));case"name":return await this.driver.findElement(t.By.name(i));case"css":return await this.driver.findElement(t.By.css(i));case"xpath":return await this.driver.findElement(t.By.xpath(i));default:throw Error(`지원하지 않는 선택자 타입: ${e}`)}}async findElement(e){return await this.driver.findElement(t.By.css(e))}async getPageSource(){return await this.driver.getPageSource()}async _getElementHtml(e,t){let i=await this._findElement(e,t);return await i.getAttribute("outerHTML")}async getElementHtml(e){return await (await this.findElement(e)).getAttribute("outerHTML")}async _click(e,t){let i=await this._findElement(e,t);await i.click()}async click(e){let t=await this.findElement(e);await this.scrollIntoView(t),await (0,n.sleepAsync)(1e3),await t.click()}async _getText(e,t){let i=await this._findElement(e,t);return await i.getText()}async getText(e){let t=await this.findElement(e);return await t.getText()}async _getAttribute(e,t,i){let n=await this._findElement(e,t);return await n.getAttribute(i)}async getAttribute(e,t){let i=await this.findElement(e);return await i.getAttribute(t)}async _sendKeys(e,t,i){let n=await this._findElement(e,t);await n.sendKeys(i)}async sendKeys(e,t){let i=await this.findElement(e);await i.sendKeys(t)}async _saveElementScreenshot(e,t,i){let r=await this._findElement(e,t),a=await r.takeScreenshot();(0,n.saveFile)(i,a,{encoding:"base64"})}async saveElementScreenshot(e,t){let i=await this.findElement(e),r=await i.takeScreenshot();(0,n.saveFile)(t,r,{encoding:"base64"})}async executeScript(e,...t){return this.driver.executeScript(e,...t)}async waitForElementToBeClickable(e,i=1e4){return this.driver.wait(t.until.elementIsEnabled(await this.findElement(e)),i)}async scrollIntoView(e){await this.executeScript("arguments[0].scrollIntoView(true);",e)}constructor(e={headless:!1,profileName:"",email:"",userDataDir:"",arguments:[]}){var n,a;a=void 0,(n="driver")in this?Object.defineProperty(this,n,{value:a,enumerable:!0,configurable:!0,writable:!0}):this[n]=a;let s=new i.default.Options;e.headless&&s.addArguments("--headless=new");let l=e.profileName??r(e.email,e.userDataDir)??null;l&&(s.addArguments(`--user-data-dir=${e.userDataDir}`),s.addArguments(`--profile-directory=${l}`)),["--disable-gpu","--no-sandbox","--disable-dev-shm-usage","--disable-blink-features=AutomationControlled","--disable-extensions","--start-maximized","--window-size=1920,1080",...e.arguments||[]].forEach(e=>s.addArguments(e)),s.excludeSwitches("enable-automation"),s.setUserPreferences({credentials_enable_service:!1,"profile.password_manager_enabled":!1,excludeSwitches:["enable-automation"],useAutomationExtension:!1}),this.driver=new t.Builder().forBrowser("chrome").setChromeOptions(s).build(),this.driver.executeScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    `)}}