/// <reference types="node" />
/// <reference types="node" />
import { Browser, BrowserContext, Page, Locator } from 'playwright';
declare const getProfileByEmail: (email?: string, userDataDir?: string) => string | null;
interface WaitOptions {
    timeout?: number;
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
}
declare class PlaywrightChrome {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    private initPromise;
    constructor(options?: {
        headless?: boolean;
        profileName?: string;
        email?: string;
        userDataDir?: string;
        arguments?: string[];
    });
    private ensureInitialized;
    private initializeBrowser;
    getFullSize(): Promise<{
        width: number;
        height: number;
    }>;
    _getFullScreenshot(): Promise<Buffer>;
    getFullScreenshot(): Promise<string>;
    saveScreenshot(path: string): Promise<void>;
    goto(url: string): Promise<void>;
    wait(selector: string, options?: WaitOptions): Promise<import("playwright-core/types/structs").ElementHandleForTag<string> | null>;
    findElements(selector: string): Promise<Locator>;
    findElement(selector: string): Promise<Locator>;
    getPageSource(): Promise<string>;
    getElementHtml(selector: string): Promise<string>;
    click(selector: string): Promise<void>;
    getText(selector: string): Promise<string | null>;
    getAttribute(selector: string, attribute: string): Promise<string | null>;
    sendKeys(selector: string, text: string): Promise<void>;
    saveElementScreenshot(selector: string, path: string): Promise<void>;
    executeScript(script: string, ...args: any[]): Promise<unknown>;
    scrollIntoView(selector: string): Promise<void>;
    close(): Promise<void>;
}
export { PlaywrightChrome, getProfileByEmail };
//# sourceMappingURL=playwright-chrome.d.ts.map