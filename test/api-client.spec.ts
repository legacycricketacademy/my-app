import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, ApiError } from '../client/src/lib/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock auth functions
vi.mock('../client/src/lib/auth', () => ({
  getToken: vi.fn(),
  getAuthProvider: vi.fn(() => 'mock'),
  refreshToken: vi.fn()
}));

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('apiRequest', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiRequest('GET', '/test');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should retry on 401 with token refresh', async () => {
      const { getToken, refreshToken } = await import('../client/src/lib/auth');
      
      // Mock token calls - getToken is synchronous
      vi.mocked(getToken)
        .mockReturnValueOnce('old-token')  // First call
        .mockReturnValueOnce('new-token'); // Second call after refresh
      
      // Mock refreshToken to return a different token
      vi.mocked(refreshToken).mockReturnValueOnce('new-token');

      // First call returns 401, second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' })
        });

      const result = await apiRequest('GET', '/test');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry on 401 if refresh fails', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('old-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      await expect(apiRequest('GET', '/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 if already retried once', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      await expect(apiRequest('GET', '/test', undefined, 1)).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError for non-ok responses', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not Found' })
      });

      await expect(apiRequest('GET', '/test')).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('token');

      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(apiRequest('GET', '/test')).rejects.toThrow(ApiError);
    });

    it('should include Authorization header when token is available', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      await apiRequest('GET', '/test');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
    });

    it('should include request body for POST requests', async () => {
      const { getToken } = await import('../client/src/lib/auth');
      
      vi.mocked(getToken).mockReturnValueOnce('token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      const requestData = { name: 'test' };
      await apiRequest('POST', '/test', requestData);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify(requestData)
      });
    });
  });
});
