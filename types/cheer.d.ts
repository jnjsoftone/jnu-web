/// <reference types="cheerio" />
interface CheerSetting {
    key: string;
    selector: string;
    target?: string;
    callback?: (value: any) => any;
}
declare const retag: ($root: any, selector: string, newTag: string) => void;
declare class Cheer {
    private source;
    private $;
    constructor(source: string);
    root(): cheerio.CheerioAPI;
    value(selector: string, target?: string): any;
    values(selector: string, target?: string): any[];
    html(selector: string): any;
    json(settings?: CheerSetting[]): any;
    jsons($roots: any[], settings?: CheerSetting[], required?: string[]): any[];
    remove(selector: string): void;
    del(selector: string): void;
    add(source: string, target: string, location?: 'before' | 'after'): void;
    retag(selector: string, newTag: string): void;
}
export { Cheer, retag };
//# sourceMappingURL=cheer.d.ts.map