import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosInstance } from 'axios';
import { ConfluenceHandlers } from '../../confluence/handlers.js';

describe('ConfluenceHandlers', () => {
  let mockClient: AxiosInstance;
  let handlers: ConfluenceHandlers;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      defaults: {
        baseURL: 'https://test.atlassian.net',
      },
    } as unknown as AxiosInstance;
    
    handlers = new ConfluenceHandlers(mockClient);
  });

  describe('readConfluencePage', () => {
    it('should read page by ID successfully', async () => {
      const mockPage = {
        id: '123',
        title: 'Test Page',
        space: { key: 'TEST', name: 'Test Space' },
        version: { number: 1 },
        body: { storage: { value: '<p>Content</p>' } },
        _links: { webui: '/spaces/TEST/pages/123' },
      };

      (mockClient.get as any).mockResolvedValue({ data: mockPage });

      const result = await handlers.readConfluencePage({ pageId: '123' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123', {
        params: { expand: 'body.storage,version,space' },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse((result.content[0] as any).text);
      expect(data).toEqual({
        id: '123',
        title: 'Test Page',
        space: { key: 'TEST', name: 'Test Space' },
        version: 1,
        webUrl: 'https://test.atlassian.net/wiki/spaces/TEST/pages/123',
        content: '<p>Content</p>',
        format: 'storage',
      });
    });

    it('should return error when neither pageId nor title provided', async () => {
      const result = await handlers.readConfluencePage({});

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Validation failed: Either pageId or title must be provided');
    });

    it('should return error when title provided without spaceKey', async () => {
      const result = await handlers.readConfluencePage({ title: 'Test' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Validation failed: spaceKey is required when using title');
    });

    it('should handle API errors', async () => {
      (mockClient.get as any).mockRejectedValue(new Error('API Error'));

      const result = await handlers.readConfluencePage({ pageId: '123' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toBe('API Error');
    });
  });

  describe('searchConfluencePages', () => {
    it('should search pages successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: '123',
              title: 'Test Page',
              type: 'page',
              space: { key: 'TEST' },
              _links: { webui: '/spaces/TEST/pages/123' },
            },
          ],
          totalSize: 1,
          start: 0,
          limit: 25,
        },
      };

      (mockClient.get as any).mockResolvedValue(mockResponse);

      const result = await handlers.searchConfluencePages({ cql: 'space = TEST' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/search', {
        params: {
          cql: 'space = TEST',
          limit: 25,
          start: 0,
          expand: undefined,
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(1);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].title).toBe('Test Page');
    });

    it('should limit results to 100 maximum', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], totalSize: 0, start: 0, limit: 100 } 
      });

      const result = await handlers.searchConfluencePages({ cql: 'test', limit: 200 });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('maxResults must be an integer between 1 and 100');
    });
  });

  describe('listConfluenceSpaces', () => {
    it('should list spaces successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1,
              key: 'TEST',
              name: 'Test Space',
              type: 'global',
              status: 'current',
              _links: { webui: '/spaces/TEST' },
            },
          ],
          size: 1,
          start: 0,
          limit: 25,
        },
      };

      (mockClient.get as any).mockResolvedValue(mockResponse);

      const result = await handlers.listConfluenceSpaces({ type: 'global' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/space', {
        params: {
          limit: 25,
          start: 0,
          status: 'current',
          type: 'global',
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(1);
      expect(data.results[0].name).toBe('Test Space');
    });
  });
});