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
    _getFullScreenshot(): Promise<any>;
    getFullScreenshot(): Promise<any>;
    saveScreenshot(path: string): Promise<void>;
    goto(url: string): Promise<void>;
    close(): Promise<void>;
    _findElements(by: string, value: string): Promise<any>;
    findElements(value: string): Promise<any>;
    _findElement(by: string, value: string): Promise<any>;
    findElement(value: string): Promise<any>;
    getPageSource(): Promise<any>;
    _getElementHtml(by: string, value: string): Promise<any>;
    getElementHtml(value: string): Promise<any>;
    _click(by: string, value: string): Promise<void>;
    click(selector: string): Promise<void>;
    _getText(by: string, value: string): Promise<any>;
    getText(value: string): Promise<any>;
    _getAttribute(by: string, value: string, attribute: string): Promise<any>;
    getAttribute(value: string, attribute: string): Promise<any>;
    _sendKeys(by: string, value: string, text: string): Promise<void>;
    sendKeys(value: string, text: string): Promise<void>;
    _saveElementScreenshot(by: string, value: string, path: string): Promise<void>;
    saveElementScreenshot(value: string, path: string): Promise<void>;
    executeScript(script: string, ...args: any[]): Promise<any>;
    waitForElementToBeClickable(selector: string, timeout?: number): Promise<any>;
    scrollIntoView(element: WebElement): Promise<void>;
}
export { Chrome, getProfileByEmail };
//# sourceMappingURL=chrome.d.ts.map