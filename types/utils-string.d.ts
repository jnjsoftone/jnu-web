declare const escapeRegExp: (value: string) => string;
declare const escapeMarkdown: (str: string) => string;
declare const escapeValue: (value: string) => string;
declare const unescapeValue: (value: string) => string;
declare const escapeDoubleQuotes: (str: string) => string;
declare const formatVariables: (variables: {
    [key: string]: string;
}) => string;
declare const escapeHtml: (unsafe: string) => string;
declare const makeUrlAbsolute: (element: any, attributeName: string, baseUrl: any) => void;
declare const formatDuration: (ms: number) => string;
export { escapeRegExp, escapeMarkdown, escapeValue, unescapeValue, escapeDoubleQuotes, formatVariables, escapeHtml, makeUrlAbsolute, formatDuration, };
//# sourceMappingURL=utils-string.d.ts.map