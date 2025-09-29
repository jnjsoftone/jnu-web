import { WebDriver, WebElement } from 'selenium-webdriver';
declare const getSeleniumChromeProfileByEmail: (email?: string, userDataDir?: string) => string | null;
declare const findExistingTempProfile: (baseName: string) => string | null;
declare const copyProfileData: (sourceProfile: string, tempProfileDir: string, userDataDir: string) => boolean;
declare class SeleniumChromeProfile {
    driver: WebDriver;
    private initPromise;
    private tempUserDataDir?;
    constructor(options?: {
        headless?: boolean;
        profileName?: string;
        email?: string;
        userDataDir?: string;
        arguments?: string[];
        useTempProfile?: boolean;
    });
    private ensureInitialized;
    private initializeDriver;
    getFullSize(): Promise<{
        width: number;
        height: number;
    }>;
    _getFullScreenshot(): Promise<string>;
    getFullScreenshot(): Promise<string>;
    saveScreenshot(path: string): Promise<void>;
    goto(url: string): Promise<void>;
    wait(selector: string, options?: any): Promise<WebElement>;
    _findElements(by: string, value: string): Promise<WebElement[]>;
    findElements(value: string): Promise<WebElement[]>;
    _findElement(by: string, value: string): Promise<WebElement>;
    findElement(value: string): Promise<WebElement>;
    getPageSource(): Promise<string>;
    _getElementHtml(by: string, value: string): Promise<string>;
    getElementHtml(value: string): Promise<string>;
    _click(by: string, value: string): Promise<void>;
    click(selector: string): Promise<void>;
    _getText(by: string, value: string): Promise<string>;
    getText(value: string): Promise<string>;
    _getAttribute(by: string, value: string, attribute: string): Promise<string>;
    getAttribute(value: string, attribute: string): Promise<string>;
    _sendKeys(by: string, value: string, text: string): Promise<void>;
    sendKeys(value: string, text: string): Promise<void>;
    _saveElementScreenshot(by: string, value: string, path: string): Promise<void>;
    saveElementScreenshot(value: string, path: string): Promise<void>;
    executeScript(script: string, ...args: any[]): Promise<unknown>;
    scrollIntoView(element: WebElement): Promise<void>;
    close(): Promise<void>;
}
export { SeleniumChromeProfile, getSeleniumChromeProfileByEmail, copyProfileData, findExistingTempProfile };
//# sourceMappingURL=selenium-chrome-profile.d.ts.map