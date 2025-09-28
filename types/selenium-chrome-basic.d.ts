import { WebDriver } from 'selenium-webdriver';
declare class SeleniumChromeBasic {
    driver: WebDriver;
    initialize(options: {
        headless?: boolean;
        arguments?: string[];
    }): Promise<void>;
    goto(url: string): Promise<void>;
    close(): Promise<void>;
}
declare const gotoBySeleniumBasic: (url: string) => Promise<WebDriver>;
export { SeleniumChromeBasic, gotoBySeleniumBasic };
//# sourceMappingURL=selenium-chrome-basic.d.ts.map