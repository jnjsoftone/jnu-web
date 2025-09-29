declare const DEFAULT_CONFIG: {
    readonly headingStyle: "atx";
    readonly hr: "---";
    readonly bulletListMarker: "-";
    readonly codeBlockStyle: "fenced";
    readonly emDelimiter: "*";
    readonly preformattedCode: true;
};
declare const DEFAULT_RULES: {
    figure: {
        filter: string;
        replacement: (content: string, node: any) => string;
    };
    codeBlock: {
        filter: string[];
        replacement: (content: string, node: any) => string;
    };
};
interface MarkdownOptions {
    config?: typeof DEFAULT_CONFIG;
    rules?: typeof DEFAULT_RULES;
}
declare const markdown: (html: string, options?: MarkdownOptions) => any;
export { markdown };
//# sourceMappingURL=markdown.d.ts.map