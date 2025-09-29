import { Browser, BrowserContext, Page } from 'playwright';
declare class PlaywrightChromeBasic {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    initialize(options: {
        headless?: boolean;
        arguments?: string[];
    }): Promise<void>;
    goto(url: string): Promise<void>;
    close(): Promise<void>;
}
declare const gotoByPlaywrightBasic: (url: string) => Promise<Page>;
export { PlaywrightChromeBasic, gotoByPlaywrightBasic };
//# sourceMappingURL=playwright-chrome-basic.d.ts.map