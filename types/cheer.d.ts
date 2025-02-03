import * as cheerio from 'cheerio';
interface CheerioSetting {
    key: string;
    selector: string;
    target?: string;
    callback?: (value: any) => any;
}
declare class Cheerio {
    private source;
    private $;
    constructor(source: string);
    root(): cheerio.CheerioAPI;
    value(selector: string, target?: string): any;
    values(selector: string, target?: string): any[];
    html(selector: string): any;
    json(settings?: CheerioSetting[]): any;
    jsons($roots: any[], settings?: CheerioSetting[], required?: string[]): any[];
}
export { Cheerio };
//# sourceMappingURL=cheer.d.ts.map