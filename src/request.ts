import axios from 'axios';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false, // SSL 인증서 검증 무시
});

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

// * Req GET
const reqGet = async (url: string, { params, config }: ReqGetParams = {}) => {
  const response = await axios.get(url, {
    httpsAgent: agent,
    params, // params를 URL 쿼리 파라미터로 추가
    ...config,
  });
  return response.data;
};

// * Req POST
const reqPost = async (url: string, { data, config }: ReqPostParams = {}): Promise<any> => {
  try {
    const response = await axios.post(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${url}:`, error);
    throw error;
  }
};

// * Req PATCH
const reqPatch = async (url: string, { data, config }: ReqPostParams = {}): Promise<any> => {
  try {
    const response = await axios.patch(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error patching data to ${url}:`, error);
    throw error;
  }
};

// * Req DELETE
const reqDelete = async (url: string, { config }: { config?: any } = {}): Promise<any> => {
  try {
    const response = await axios.delete(url, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting data from ${url}:`, error);
    throw error;
  }
};

// * Req UPSERT
const reqUpsert = async (url: string, { data, config }: ReqPostParams = {}): Promise<any> => {
  try {
    const response = await axios.put(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error upserting data to ${url}:`, error);
    throw error;
  }
};

// * Graphql
// example: query = { dailys(date: ${date}) { id state patientInfo { name age sex } } } }
// values = {date: "20240418"}
const gqlWithValues = (query: string | undefined, values: any) => {
  return !query ? query : query.replace(/\$\{?(\w+)\}?/g, (match: any, key) => values[key] || match); // 키에 해당하는 값이 없다면, 매치된 문자열 그대로 반환
};
// * req
const reqGql = async (url: string, { query, values, config }: ReqGqlParams = {}) => {
  query = gqlWithValues(query, values);
  const response = await axios.post(url, { query }, { httpsAgent: agent });
  return response.data;
};

export { reqGet, reqPost, reqPatch, reqDelete, reqUpsert, reqGql, gqlWithValues };
