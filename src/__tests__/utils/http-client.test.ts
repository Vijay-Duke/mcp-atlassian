import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { createAtlassianClient, formatApiError } from '../../utils/http-client.js';

vi.mock('axios');

describe('http-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('createAtlassianClient', () => {
    it('should create client with correct configuration', () => {
      // Clear proxy environment variables
      delete process.env.HTTPS_PROXY;
      delete process.env.https_proxy;
      delete process.env.HTTP_PROXY;
      delete process.env.http_proxy;

      process.env.ATLASSIAN_BASE_URL = 'https://test.atlassian.net';
      process.env.ATLASSIAN_EMAIL = 'test@example.com';
      process.env.ATLASSIAN_API_TOKEN = 'test-token';

      const mockInterceptors = {
        request: {
          use: vi.fn(),
        },
      };
      const mockCreate = vi.fn().mockReturnValue({ interceptors: mockInterceptors });
      (axios.create as any) = mockCreate;

      createAtlassianClient();

      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://test.atlassian.net',
        auth: {
          username: 'test@example.com',
          password: 'test-token',
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: expect.any(Function),
      });

      expect(mockInterceptors.request.use).toHaveBeenCalled();
    });

    it('should throw error when environment variables are missing', () => {
      delete process.env.ATLASSIAN_BASE_URL;

      expect(() => createAtlassianClient()).toThrow('Missing required environment variables');
    });
  });

  describe('formatApiError', () => {
    it('should format 401 error correctly', () => {
      const error = {
        response: { status: 401, data: {} },
        isAxiosError: true,
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe('Authentication failed. Please check your API token and email.');
    });

    it('should format 403 error correctly', () => {
      const error = {
        response: { status: 403, data: {} },
        isAxiosError: true,
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe(
        'Access forbidden. Your API token may not have the required permissions.'
      );
    });

    it('should format 404 error correctly', () => {
      const error = {
        response: { status: 404, data: {} },
        isAxiosError: true,
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe('Resource not found. Please check the ID or key provided.');
    });

    it('should format 429 error correctly', () => {
      const error = {
        response: { status: 429, data: {} },
        isAxiosError: true,
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should format error with custom message', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        isAxiosError: true,
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe('API Error (500): Internal server error');
    });

    it('should format network error', () => {
      const error = {
        request: {},
        isAxiosError: true,
        message: 'Network Error',
      } as AxiosError;

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(true);

      const result = formatApiError(error);
      expect(result).toBe('Network error: Unable to reach Atlassian API. Network Error');
    });

    it('should format unknown error', () => {
      const error = new Error('Unknown error');

      (axios.isAxiosError as any) = vi.fn().mockReturnValue(false);

      const result = formatApiError(error);
      expect(result).toBe('Unknown error');
    });
  });
});
