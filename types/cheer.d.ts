/// <reference types="cheerio" />
interface CheerSetting {
    key: string;
    selector: string;
    attribute?: string;
    callback?: (value: any) => any;
}
declare class Cheer {
    private source;
    private $;
    constructor(source: string);
    root(): cheerio.CheerioAPI;
    value(selector: string, attribute?: string): any;
    values(selector: string, attribute?: string): any[];
    html(selector: string): any;
    json(settings?: CheerSetting[]): any;
    jsons($elements: any, settings?: CheerSetting[], required?: string[]): any[];
    remove(selector: string): void;
    del(selector: string): void;
    add(srcHtml: string, dstSelector: string, location?: 'before' | 'after'): void;
    retag(selector: string, newTag: string): void;
    find(selector: string): any;
}
export { Cheer };
//# sourceMappingURL=cheer.d.ts.map