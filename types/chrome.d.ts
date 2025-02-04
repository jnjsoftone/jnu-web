import { WebDriver, WebElement } from 'selenium-webdriver';
declare const getProfileByEmail: (email?: string, userDataDir?: string) => string | null;
declare class Chrome {
    driver: WebDriver;
    constructor(options?: {
        headless?: boolean;
        profileName?: string;
        email?: string;
        userDataDir?: string;
        arguments?: string[];
    });
    getFullSize(): Promise<{
        width: number;
        height: number;
    }>;
    _getFullScreenshot(): Promise<string>;
    getFullScreenshot(): Promise<string>;
    saveScreenshot(path: string): Promise<void>;
    goto(url: string): Promise<void>;
    close(): Promise<void>;
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
    waitForElementToBeClickable(selector: string, timeout?: number): Promise<WebElement>;
    scrollIntoView(element: WebElement): Promise<void>;
}
export { Chrome, getProfileByEmail };
//# sourceMappingURL=chrome.d.ts.map