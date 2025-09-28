import axios from 'axios';
import { reqGet, reqPost, reqPatch, reqDelete, reqUpsert, reqGql, gqlWithValues } from '../../src/request';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Request Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reqGet', () => {
    it('should make a GET request with default parameters', async () => {
      const mockData = { message: 'success' };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await reqGet('https://example.com');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com', {
        httpsAgent: expect.any(Object),
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it('should make a GET request with params and config', async () => {
      const mockData = { users: [] };
      const params = { page: 1, limit: 10 };
      const config = { timeout: 5000 };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await reqGet('https://api.example.com/users', { params, config });

      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        httpsAgent: expect.any(Object),
        params,
        timeout: 5000,
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('reqPost', () => {
    it('should make a POST request successfully', async () => {
      const mockData = { id: 1, created: true };
      const postData = { name: 'Test User', email: 'test@example.com' };
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await reqPost('https://api.example.com/users', { data: postData });

      expect(mockedAxios.post).toHaveBeenCalledWith('https://api.example.com/users', postData, {
        httpsAgent: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });

    it('should handle POST request errors', async () => {
      const error = new Error('Network Error');
      mockedAxios.post.mockRejectedValue(error);

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(reqPost('https://api.example.com/users', { data: {} })).rejects.toThrow('Network Error');

      expect(consoleSpy).toHaveBeenCalledWith('Error posting data to https://api.example.com/users:', error);
      consoleSpy.mockRestore();
    });

    it('should make a POST request with custom config', async () => {
      const mockData = { success: true };
      const config = { headers: { 'Content-Type': 'application/json' } };
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await reqPost('https://api.example.com/data', { data: {}, config });

      expect(mockedAxios.post).toHaveBeenCalledWith('https://api.example.com/data', {}, {
        httpsAgent: expect.any(Object),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('reqPatch', () => {
    it('should make a PATCH request successfully', async () => {
      const mockData = { id: 1, updated: true };
      const patchData = { name: 'Updated User' };
      mockedAxios.patch.mockResolvedValue({ data: mockData });

      const result = await reqPatch('https://api.example.com/users/1', { data: patchData });

      expect(mockedAxios.patch).toHaveBeenCalledWith('https://api.example.com/users/1', patchData, {
        httpsAgent: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });

    it('should handle PATCH request errors', async () => {
      const error = new Error('Not Found');
      mockedAxios.patch.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(reqPatch('https://api.example.com/users/999', { data: {} })).rejects.toThrow('Not Found');

      expect(consoleSpy).toHaveBeenCalledWith('Error patching data to https://api.example.com/users/999:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('reqDelete', () => {
    it('should make a DELETE request successfully', async () => {
      const mockData = { deleted: true };
      mockedAxios.delete.mockResolvedValue({ data: mockData });

      const result = await reqDelete('https://api.example.com/users/1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/1', {
        httpsAgent: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });

    it('should make a DELETE request with config', async () => {
      const mockData = { deleted: true };
      const config = { headers: { Authorization: 'Bearer token' } };
      mockedAxios.delete.mockResolvedValue({ data: mockData });

      const result = await reqDelete('https://api.example.com/users/1', { config });

      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/1', {
        httpsAgent: expect.any(Object),
        headers: { Authorization: 'Bearer token' },
      });
      expect(result).toEqual(mockData);
    });

    it('should handle DELETE request errors', async () => {
      const error = new Error('Unauthorized');
      mockedAxios.delete.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(reqDelete('https://api.example.com/users/1')).rejects.toThrow('Unauthorized');

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting data from https://api.example.com/users/1:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('reqUpsert', () => {
    it('should make a PUT request successfully', async () => {
      const mockData = { id: 1, created: false, updated: true };
      const putData = { name: 'Upserted User', email: 'upsert@example.com' };
      mockedAxios.put.mockResolvedValue({ data: mockData });

      const result = await reqUpsert('https://api.example.com/users/1', { data: putData });

      expect(mockedAxios.put).toHaveBeenCalledWith('https://api.example.com/users/1', putData, {
        httpsAgent: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });

    it('should handle PUT request errors', async () => {
      const error = new Error('Server Error');
      mockedAxios.put.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(reqUpsert('https://api.example.com/users/1', { data: {} })).rejects.toThrow('Server Error');

      expect(consoleSpy).toHaveBeenCalledWith('Error upserting data to https://api.example.com/users/1:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('gqlWithValues', () => {
    it('should replace simple variable placeholders', () => {
      const query = 'query { user(id: ${userId}) { name email } }';
      const values = { userId: 123 };

      const result = gqlWithValues(query, values);

      expect(result).toBe('query { user(id: 123) { name email } }');
    });

    it('should replace multiple variable placeholders', () => {
      const query = 'query { dailys(date: ${date}, status: ${status}) { id name } }';
      const values = { date: '20240418', status: 'active' };

      const result = gqlWithValues(query, values);

      expect(result).toBe('query { dailys(date: 20240418, status: active) { id name } }');
    });

    it('should handle variables with curly braces', () => {
      const query = 'query { posts(limit: ${limit}) { title content } }';
      const values = { limit: 10 };

      const result = gqlWithValues(query, values);

      expect(result).toBe('query { posts(limit: 10) { title content } }');
    });

    it('should leave unmatched variables as-is', () => {
      const query = 'query { user(id: ${userId}, name: ${userName}) { email } }';
      const values = { userId: 123 };

      const result = gqlWithValues(query, values);

      expect(result).toBe('query { user(id: 123, name: ${userName}) { email } }');
    });

    it('should return undefined for undefined query', () => {
      const result = gqlWithValues(undefined, { userId: 123 });

      expect(result).toBeUndefined();
    });

    it('should handle empty values object', () => {
      const query = 'query { user(id: ${userId}) { name } }';

      const result = gqlWithValues(query, {});

      expect(result).toBe('query { user(id: ${userId}) { name } }');
    });
  });

  describe('reqGql', () => {
    it('should make a GraphQL request with variable substitution', async () => {
      const mockData = { data: { user: { name: 'John', email: 'john@example.com' } } };
      const query = 'query { user(id: ${userId}) { name email } }';
      const values = { userId: 123 };
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await reqGql('https://api.example.com/graphql', { query, values });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        { query: 'query { user(id: 123) { name email } }' },
        { httpsAgent: expect.any(Object) }
      );
      expect(result).toEqual(mockData);
    });

    it('should make a GraphQL request without variables', async () => {
      const mockData = { data: { users: [] } };
      const query = 'query { users { id name email } }';
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await reqGql('https://api.example.com/graphql', { query });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        { query: 'query { users { id name email } }' },
        { httpsAgent: expect.any(Object) }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle empty parameters', async () => {
      const mockData = { data: null };
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await reqGql('https://api.example.com/graphql');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        { query: undefined },
        { httpsAgent: expect.any(Object) }
      );
      expect(result).toEqual(mockData);
    });
  });
});