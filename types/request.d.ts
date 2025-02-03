declare const requestGet: ({ url, params, config }: {
    url: string;
    params?: any;
    config?: any;
}) => Promise<any>;
declare const requestPost: ({ url, data, config }: {
    url: string;
    data?: any;
    config?: any;
}) => Promise<any>;
declare const requestPatch: ({ url, data, config }: {
    url: string;
    data?: any;
    config?: any;
}) => Promise<any>;
declare const requestDelete: ({ url, config }: {
    url: string;
    config?: any;
}) => Promise<any>;
declare const requestUpsert: ({ url, data, config }: {
    url: string;
    data?: any;
    config?: any;
}) => Promise<any>;
declare const gqlWithValues: (query: string | undefined, values: any) => string | undefined;
declare const requestGql: ({ url, query, values, config }: {
    url: string;
    query?: string | undefined;
    values?: any;
    config?: any;
}) => Promise<any>;
export { requestGet, requestPost, requestPatch, requestDelete, requestUpsert, requestGql, gqlWithValues };
//# sourceMappingURL=request.d.ts.map