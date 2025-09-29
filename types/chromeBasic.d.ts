import { WebDriver } from 'selenium-webdriver';
declare class ChromeBasic {
    driver: WebDriver;
    initialize(options: {
        headless?: boolean;
        arguments?: string[];
    }): Promise<void>;
    goto(url: string): Promise<void>;
    close(): Promise<void>;
}
declare const goChrome: (url: string) => Promise<WebDriver>;
export { ChromeBasic, goChrome };
//# sourceMappingURL=chromeBasic.d.ts.map