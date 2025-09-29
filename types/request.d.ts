interface ReqGetParams {
    params?: any;
    config?: any;
}
interface ReqPostParams {
    data?: any;
    config?: any;
}
interface ReqGqlParams {
    query?: string;
    values?: any;
    config?: any;
}
declare const reqGet: (url: string, { params, config }?: ReqGetParams) => Promise<any>;
declare const reqPost: (url: string, { data, config }?: ReqPostParams) => Promise<any>;
declare const reqPatch: (url: string, { data, config }?: ReqPostParams) => Promise<any>;
declare const reqDelete: (url: string, { config }?: {
    config?: any;
}) => Promise<any>;
declare const reqUpsert: (url: string, { data, config }?: ReqPostParams) => Promise<any>;
declare const gqlWithValues: (query: string | undefined, values: any) => string | undefined;
declare const reqGql: (url: string, { query, values, config }?: ReqGqlParams) => Promise<any>;
export { reqGet, reqPost, reqPatch, reqDelete, reqUpsert, reqGql, gqlWithValues };
//# sourceMappingURL=request.d.ts.map