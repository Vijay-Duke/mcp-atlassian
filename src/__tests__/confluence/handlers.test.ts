import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosInstance } from 'axios';
import { ConfluenceHandlers } from '../../confluence/handlers.js';

describe('ConfluenceHandlers', () => {
  let mockClient: AxiosInstance;
  let handlers: ConfluenceHandlers;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: {
        baseURL: 'https://test.atlassian.net',
      },
    } as unknown as AxiosInstance;
    
    handlers = new ConfluenceHandlers(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    it('should read page by title and spaceKey', async () => {
      const mockPage = {
        id: '456',
        title: 'Page By Title',
        space: { key: 'DEMO', name: 'Demo Space' },
        version: { number: 2 },
        body: { storage: { value: '<h1>Header</h1>' } },
        _links: { webui: '/spaces/DEMO/pages/456' },
      };

      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [mockPage] } 
      });

      const result = await handlers.readConfluencePage({ 
        title: 'Page By Title',
        spaceKey: 'DEMO' 
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content', {
        params: { 
          spaceKey: 'DEMO',
          title: 'Page By Title',
          expand: 'body.storage,version,space' 
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.title).toBe('Page By Title');
    });

    it('should convert content to markdown when format is markdown', async () => {
      const mockPage = {
        id: '789',
        title: 'Markdown Test',
        space: { key: 'MD', name: 'Markdown Space' },
        version: { number: 1 },
        body: { storage: { value: '<h1>Header</h1><p>Paragraph</p>' } },
        _links: { webui: '/spaces/MD/pages/789' },
      };

      (mockClient.get as any).mockResolvedValue({ data: mockPage });

      const result = await handlers.readConfluencePage({ 
        pageId: '789',
        format: 'markdown' 
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.format).toBe('markdown');
      expect(data.content).toContain('# Header');
      expect(data.content).toContain('Paragraph');
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

    it('should handle no page found by title', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [] } 
      });

      const result = await handlers.readConfluencePage({ 
        title: 'Non-existent',
        spaceKey: 'TEST' 
      });

      expect(result.isError).toBeUndefined();
      expect((result.content[0] as any).text).toContain('No page found with title "Non-existent" in space TEST');
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

    it('should validate CQL query', async () => {
      const result = await handlers.searchConfluencePages({ cql: '' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('cql cannot be empty');
    });

    it('should limit results to 100 maximum', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], totalSize: 0, start: 0, limit: 100 } 
      });

      const result = await handlers.searchConfluencePages({ cql: 'test', limit: 200 });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('maxResults must be an integer between 1 and 100');
    });

    it('should handle pagination parameters', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], totalSize: 50, start: 10, limit: 10 } 
      });

      const result = await handlers.searchConfluencePages({ 
        cql: 'type = page',
        start: 10,
        limit: 10,
        expand: 'body.storage'
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/search', {
        params: {
          cql: 'type = page',
          limit: 10,
          start: 10,
          expand: 'body.storage',
        },
      });
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

    it('should list spaces with different status', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], size: 0, start: 0, limit: 25 } 
      });

      await handlers.listConfluenceSpaces({ status: 'archived' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/space', {
        params: {
          limit: 25,
          start: 0,
          status: 'archived',
        },
      });
    });

    it('should handle pagination', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], size: 100, start: 50, limit: 10 } 
      });

      await handlers.listConfluenceSpaces({ 
        limit: 10,
        start: 50 
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/space', {
        params: {
          limit: 10,
          start: 50,
          status: 'current',
        },
      });
    });
  });

  describe('listConfluenceAttachments', () => {
    it('should list attachments successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'att123',
              title: 'document.pdf',
              extensions: { mediaType: 'application/pdf', fileSize: 1024 },
              version: { number: 1 },
              _links: { 
                download: '/download/attachments/123/document.pdf',
                webui: '/spaces/TEST/pages/123/attachments' 
              },
            },
          ],
          size: 1,
          start: 0,
          limit: 50,
        },
      };

      (mockClient.get as any).mockResolvedValue(mockResponse);

      const result = await handlers.listConfluenceAttachments({ pageId: '123' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123/child/attachment', {
        params: {
          limit: 50,
          start: 0,
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(1);
      expect(data.attachments[0].title).toBe('document.pdf');
      expect(data.attachments[0].fileSize).toBe(1024);
    });

    it('should filter by mediaType', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], size: 0, start: 0, limit: 50 } 
      });

      await handlers.listConfluenceAttachments({ 
        pageId: '123',
        mediaType: 'image/png' 
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123/child/attachment', {
        params: {
          limit: 50,
          start: 0,
          mediaType: 'image/png',
        },
      });
    });

    it('should filter by filename', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], size: 0, start: 0, limit: 50 } 
      });

      await handlers.listConfluenceAttachments({ 
        pageId: '123',
        filename: 'report.pdf' 
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123/child/attachment', {
        params: {
          limit: 50,
          start: 0,
          filename: 'report.pdf',
        },
      });
    });

    it('should validate required pageId', async () => {
      const result = await handlers.listConfluenceAttachments({ pageId: '' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('pageId cannot be empty');
    });
  });

  describe('createConfluencePage', () => {
    it('should create page successfully', async () => {
      const mockResponse = {
        data: {
          id: '999',
          title: 'New Page',
          type: 'page',
          space: { key: 'TEST', name: 'Test Space' },
          version: { number: 1 },
          _links: { webui: '/spaces/TEST/pages/999' },
        },
      };

      (mockClient.post as any).mockResolvedValue(mockResponse);

      const result = await handlers.createConfluencePage({
        spaceKey: 'TEST',
        title: 'New Page',
        content: '<p>Page content</p>',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/wiki/rest/api/content', {
        type: 'page',
        title: 'New Page',
        space: { key: 'TEST' },
        body: {
          storage: {
            value: '<p>Page content</p>',
            representation: 'storage',
          },
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.id).toBe('999');
      expect(data.message).toBe('Page created successfully');
    });

    it('should create page with parent', async () => {
      (mockClient.post as any).mockResolvedValue({ 
        data: { id: '1000', title: 'Child Page', _links: {} } 
      });

      await handlers.createConfluencePage({
        spaceKey: 'TEST',
        title: 'Child Page',
        content: '<p>Child content</p>',
        parentId: '500',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/wiki/rest/api/content', {
        type: 'page',
        title: 'Child Page',
        space: { key: 'TEST' },
        body: {
          storage: {
            value: '<p>Child content</p>',
            representation: 'storage',
          },
        },
        ancestors: [{ id: '500' }],
      });
    });

    it('should validate required fields', async () => {
      const result = await handlers.createConfluencePage({
        spaceKey: '',
        title: 'Test',
        content: 'Content',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('spaceKey cannot be empty');
    });

    it('should handle creation errors', async () => {
      (mockClient.post as any).mockRejectedValue(new Error('Creation failed'));

      const result = await handlers.createConfluencePage({
        spaceKey: 'TEST',
        title: 'New Page',
        content: 'Content',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toBe('Creation failed');
    });
  });

  describe('updateConfluencePage', () => {
    it('should update page successfully', async () => {
      const currentPage = {
        id: '123',
        type: 'page',
        title: 'Old Title',
        space: { key: 'TEST' },
        body: { storage: { value: '<p>Old content</p>' } },
        version: { number: 1 },
      };

      const updatedPage = {
        ...currentPage,
        title: 'New Title',
        body: { storage: { value: '<p>New content</p>' } },
        version: { number: 2 },
        _links: { webui: '/spaces/TEST/pages/123' },
      };

      (mockClient.get as any).mockResolvedValue({ data: currentPage });
      (mockClient.put as any).mockResolvedValue({ data: updatedPage });

      const result = await handlers.updateConfluencePage({
        pageId: '123',
        title: 'New Title',
        content: '<p>New content</p>',
        version: 1,
      });

      expect(mockClient.put).toHaveBeenCalledWith('/wiki/rest/api/content/123', {
        id: '123',
        type: 'page',
        title: 'New Title',
        space: { key: 'TEST' },
        version: { number: 1, minorEdit: false },
        body: {
          storage: {
            value: '<p>New content</p>',
            representation: 'storage',
          },
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.message).toBe('Page updated successfully');
      expect(data.version).toBe(2);
    });

    it('should update with version comment', async () => {
      const currentPage = {
        id: '123',
        type: 'page',
        title: 'Title',
        space: { key: 'TEST' },
        body: { storage: { value: '<p>Content</p>' } },
        version: { number: 1 },
      };

      (mockClient.get as any).mockResolvedValue({ data: currentPage });
      (mockClient.put as any).mockResolvedValue({ data: { ...currentPage, _links: {} } });

      await handlers.updateConfluencePage({
        pageId: '123',
        content: '<p>Updated</p>',
        version: 1,
        versionComment: 'Fixed typo',
        minorEdit: true,
      });

      expect(mockClient.put).toHaveBeenCalledWith('/wiki/rest/api/content/123', 
        expect.objectContaining({
          version: { 
            number: 1, 
            minorEdit: true,
            message: 'Fixed typo'
          },
        })
      );
    });

    it('should validate required version', async () => {
      const result = await handlers.updateConfluencePage({
        pageId: '123',
        content: 'New content',
        version: undefined as any,
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('version is required');
    });
  });

  describe('addConfluenceComment', () => {
    it('should add comment successfully', async () => {
      const mockResponse = {
        data: {
          id: 'comment123',
          type: 'comment',
          version: { 
            number: 1,
            by: { displayName: 'John Doe' },
            when: '2024-01-01T00:00:00Z'
          },
          _links: { webui: '/spaces/TEST/pages/123#comment-comment123' },
        },
      };

      (mockClient.post as any).mockResolvedValue(mockResponse);

      const result = await handlers.addConfluenceComment({
        pageId: '123',
        content: '<p>Great article!</p>',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/wiki/rest/api/content', {
        type: 'comment',
        container: {
          id: '123',
          type: 'page',
        },
        body: {
          storage: {
            value: '<p>Great article!</p>',
            representation: 'storage',
          },
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.message).toBe('Comment added successfully');
      expect(data.createdBy).toBe('John Doe');
    });

    it('should add reply to comment', async () => {
      (mockClient.post as any).mockResolvedValue({ 
        data: { id: 'reply123', _links: {} } 
      });

      await handlers.addConfluenceComment({
        pageId: '123',
        content: '<p>I agree!</p>',
        parentCommentId: 'comment456',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/wiki/rest/api/content', {
        type: 'comment',
        container: {
          id: '123',
          type: 'page',
        },
        body: {
          storage: {
            value: '<p>I agree!</p>',
            representation: 'storage',
          },
        },
        ancestors: [{ id: 'comment456' }],
      });
    });
  });

  describe('exportConfluencePage', () => {
    it('should export page to HTML', async () => {
      const mockPage = {
        id: '123',
        title: 'Export Test',
        space: { key: 'TEST', name: 'Test Space' },
        version: { number: 1, when: '2024-01-01T00:00:00Z' },
        body: {
          export_view: {
            value: '<h1>Title</h1><p>Content</p>',
          },
        },
        _links: { webui: '/spaces/TEST/pages/123' },
      };

      (mockClient.get as any).mockResolvedValue({ data: mockPage });

      const result = await handlers.exportConfluencePage({
        pageId: '123',
        format: 'html',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.format).toBe('html');
      expect(data.filename).toContain('.html');
      expect(data.mimeType).toBe('text/html');
      expect(data.base64Data).toBeDefined();
    });

    it('should export page to Markdown', async () => {
      const mockPage = {
        id: '456',
        title: 'Markdown Export',
        space: { key: 'MD', name: 'Markdown Space' },
        version: { number: 2 },
        body: {
          export_view: {
            value: '<h1>Header</h1><p>Paragraph</p>',
          },
        },
        _links: { webui: '/spaces/MD/pages/456' },
      };

      (mockClient.get as any).mockResolvedValue({ data: mockPage });

      const result = await handlers.exportConfluencePage({
        pageId: '456',
        format: 'markdown',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.format).toBe('markdown');
      expect(data.filename).toContain('.md');
      expect(data.mimeType).toBe('text/markdown');
      expect(data.base64Data).toBeDefined();
      
      // Decode and check markdown content
      const content = Buffer.from(data.base64Data, 'base64').toString('utf-8');
      expect(content).toContain('# Header');
      expect(content).toContain('Paragraph');
    });

    it('should handle missing export view', async () => {
      const mockPage = {
        id: '789',
        title: 'No Export',
        body: {},
      };

      (mockClient.get as any).mockResolvedValue({ data: mockPage });

      const result = await handlers.exportConfluencePage({
        pageId: '789',
        format: 'html',
      });

      expect(result.isError).toBe(true);
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.error).toBe('Could not retrieve page export view');
    });
  });

  describe('getConfluenceLabels', () => {
    it('should get page labels successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { prefix: 'global', name: 'important', id: 'label1', label: 'important' },
            { prefix: 'my', name: 'todo', id: 'label2', label: 'my:todo' },
          ],
          size: 2,
          start: 0,
          limit: 25,
        },
      };

      (mockClient.get as any).mockResolvedValue(mockResponse);

      const result = await handlers.getConfluenceLabels({ pageId: '123' });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123/label', {
        params: {
          limit: 25,
          start: 0,
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(2);
      expect(data.labels).toHaveLength(2);
      expect(data.labels[0].name).toBe('important');
    });

    it('should filter labels by prefix', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { results: [], size: 0 } 
      });

      await handlers.getConfluenceLabels({ 
        pageId: '123',
        prefix: 'my' 
      });

      expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/content/123/label', {
        params: {
          limit: 25,
          start: 0,
          prefix: 'my',
        },
      });
    });
  });

  describe('addConfluenceLabels', () => {
    it('should add labels successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { prefix: 'global', name: 'important', id: 'label1', label: 'important' },
            { prefix: 'global', name: 'reviewed', id: 'label2', label: 'reviewed' },
          ],
        },
      };

      (mockClient.post as any).mockResolvedValue(mockResponse);

      const result = await handlers.addConfluenceLabels({
        pageId: '123',
        labels: [
          { name: 'important' },
          { name: 'reviewed' },
        ],
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/wiki/rest/api/content/123/label',
        [
          { prefix: 'global', name: 'important' },
          { prefix: 'global', name: 'reviewed' },
        ]
      );

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalLabels).toBe(2);
      expect(data.message).toContain('Successfully added 2 label(s)');
    });

    it('should validate labels array', async () => {
      const result = await handlers.addConfluenceLabels({
        pageId: '123',
        labels: [],
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('labels must be a non-empty array');
    });
  });

  describe('uploadConfluenceAttachment', () => {
    it('should upload attachment successfully', async () => {
      const mockResponse = {
        data: {
          results: [{
            id: 'att999',
            title: 'upload.pdf',
            extensions: { fileSize: 2048, comment: 'Test upload' },
            metadata: { mediaType: 'application/pdf' },
            version: { number: 1 },
            _links: { 
              download: '/download/attachments/123/upload.pdf',
              webui: '/spaces/TEST/pages/123/attachments' 
            },
          }],
        },
      };

      (mockClient.post as any).mockResolvedValue(mockResponse);

      const result = await handlers.uploadConfluenceAttachment({
        pageId: '123',
        file: Buffer.from('test content').toString('base64'),
        filename: 'upload.pdf',
        comment: 'Test upload',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.id).toBe('att999');
      expect(data.filename).toBe('upload.pdf');
      expect(data.comment).toBe('Test upload');
    });

    it('should validate required fields', async () => {
      const result = await handlers.uploadConfluenceAttachment({
        pageId: '',
        file: 'base64data',
        filename: 'test.pdf',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('pageId cannot be empty');
    });
  });

  describe('User-related methods', () => {
    describe('getConfluenceCurrentUser', () => {
      it('should get current user successfully', async () => {
        const mockUser = {
          accountId: 'user123',
          displayName: 'John Doe',
          publicName: 'johndoe',
          email: 'john@example.com',
          profilePicture: { path: '/avatar.png' },
          type: 'known',
        };

        (mockClient.get as any).mockResolvedValue({ data: mockUser });

        const result = await handlers.getConfluenceCurrentUser();

        expect(mockClient.get).toHaveBeenCalledWith('/api/user/current');
        expect(result.isError).toBeFalsy();
        
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.accountId).toBe('user123');
        expect(data.displayName).toBe('John Doe');
      });
    });

    describe('getConfluenceUser', () => {
      it('should get user by accountId', async () => {
        const mockUser = {
          accountId: 'user456789012',
          displayName: 'Jane Smith',
          email: 'jane@example.com',
          type: 'known',
        };

        (mockClient.get as any).mockResolvedValue({ data: mockUser });

        const result = await handlers.getConfluenceUser({ accountId: 'user456789012' });

        expect(mockClient.get).toHaveBeenCalledWith('/api/user', {
          params: { accountId: 'user456789012' }
        });
        
        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.displayName).toBe('Jane Smith');
      });

      it('should search user by username', async () => {
        const mockSearchResponse = {
          data: {
            results: [{
              user: {
                accountId: 'user789',
                displayName: 'Bob Wilson',
                email: 'bob@example.com',
              }
            }]
          }
        };

        (mockClient.get as any).mockResolvedValue(mockSearchResponse);

        const result = await handlers.getConfluenceUser({ username: 'bwilson' });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.displayName).toBe('Bob Wilson');
      });

      it('should validate user identification', async () => {
        const result = await handlers.getConfluenceUser({});

        expect(result.isError).toBe(true);
        expect((result.content[0] as any).text).toContain('At least one user identifier (username, accountId, or email) is required');
      });
    });

    describe('findConfluenceUsers', () => {
      it('should find users with CQL', async () => {
        const mockResponse = {
          data: {
            results: [
              { 
                userKey: 'key1',
                username: 'user1',
                accountId: 'acc1',
                displayName: 'User One',
                active: true 
              }
            ],
            size: 1,
            start: 0,
            limit: 25,
          }
        };

        (mockClient.get as any).mockResolvedValue(mockResponse);

        const result = await handlers.findConfluenceUsers({ 
          cql: 'type = user',
          limit: 10 
        });

        expect(mockClient.get).toHaveBeenCalledWith('/wiki/rest/api/user/search', {
          params: {
            cql: 'type = user',
            limit: 10,
            start: 0,
          }
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.users).toHaveLength(1);
      });

      it('should handle user search endpoint not available', async () => {
        (mockClient.get as any)
          .mockRejectedValueOnce(new Error('Not found'))
          .mockRejectedValueOnce(new Error('Not found'));

        const result = await handlers.findConfluenceUsers({ username: 'test' });

        expect(result.isError).toBe(false);
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.message).toContain('User search endpoint not available');
      });
    });
  });

  describe('Space navigation methods', () => {
    describe('getConfluenceSpace', () => {
      it('should get space details', async () => {
        const mockSpace = {
          id: 'space123',
          key: 'TEST',
          name: 'Test Space',
          type: 'global',
          status: 'current',
          description: { plain: { value: 'Test space description' } },
          _links: { webui: '/spaces/TEST' },
        };

        (mockClient.get as any).mockResolvedValue({ data: mockSpace });

        const result = await handlers.getConfluenceSpace({ spaceKey: 'TEST' });

        expect(mockClient.get).toHaveBeenCalledWith('/api/space/TEST', {
          params: { expand: 'description.plain,homepage' }
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.key).toBe('TEST');
        expect(data.description).toBe('Test space description');
      });
    });

    describe('listConfluencePageChildren', () => {
      it('should list page children', async () => {
        const mockResponse = {
          data: {
            results: [
              {
                id: 'child1',
                title: 'Child Page 1',
                type: 'page',
                status: 'current',
                space: { key: 'TEST' },
                _links: { webui: '/pages/child1' },
              }
            ],
            size: 1,
            start: 0,
            limit: 25,
          }
        };

        (mockClient.get as any).mockResolvedValue(mockResponse);

        const result = await handlers.listConfluencePageChildren({ pageId: '123' });

        expect(mockClient.get).toHaveBeenCalledWith('/api/content/123/child/page', {
          params: {
            limit: 25,
            start: 0,
            expand: 'space'
          }
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.parentPageId).toBe('123');
        expect(data.children).toHaveLength(1);
      });
    });

    describe('listConfluencePageAncestors', () => {
      it('should list page ancestors', async () => {
        const mockPage = {
          id: '123',
          title: 'Current Page',
          ancestors: [
            { id: 'root', title: 'Space Home', type: 'page', _links: { webui: '/pages/root' } },
            { id: 'parent', title: 'Parent Page', type: 'page', _links: { webui: '/pages/parent' } },
          ],
        };

        (mockClient.get as any).mockResolvedValue({ data: mockPage });

        const result = await handlers.listConfluencePageAncestors({ pageId: '123' });

        expect(mockClient.get).toHaveBeenCalledWith('/api/content/123', {
          params: { expand: 'ancestors' }
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.ancestors).toHaveLength(2);
        expect(data.depth).toBe(2);
        // Check that ancestors are reversed (root first)
        expect(data.ancestors[0].title).toBe('Parent Page');
        expect(data.ancestors[1].title).toBe('Space Home');
      });
    });
  });

  describe('downloadConfluencePageComplete', () => {
    it('should download page with attachments', async () => {
      const mockPage = {
        id: '123',
        title: 'Complete Page',
        space: { key: 'TEST' },
        version: { number: 1 },
        body: {
          storage: { value: '<p>Page content</p>' },
          view: { value: '<p>View content</p>' },
        },
        metadata: { labels: { results: [] } },
        ancestors: [],
        _links: { webui: '/pages/123' },
      };

      const mockAttachments = {
        data: {
          results: [
            {
              id: 'att1',
              title: 'small.txt',
              extensions: { mediaType: 'text/plain', fileSize: 100 },
              version: { number: 1 },
              _links: { download: '/download/att1' },
            },
          ],
        },
      };

      (mockClient.get as any)
        .mockResolvedValueOnce({ data: mockPage })
        .mockResolvedValueOnce(mockAttachments)
        .mockResolvedValueOnce({ data: Buffer.from('file content') });

      const result = await handlers.downloadConfluencePageComplete({
        pageId: '123',
        includeAttachments: true,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.page.id).toBe('123');
      expect(data.attachments).toHaveLength(1);
      expect(data.summary.downloadedAttachments).toBe(1);
    });

    it('should skip large attachments', async () => {
      const mockPage = {
        id: '456',
        title: 'Page with Large Attachment',
        body: { storage: { value: '' }, view: { value: '' } },
        _links: {},
      };

      const mockAttachments = {
        data: {
          results: [
            {
              id: 'att2',
              title: 'huge.zip',
              extensions: { mediaType: 'application/zip', fileSize: 100000000 }, // 100MB
              _links: { download: '/download/att2' },
            },
          ],
        },
      };

      (mockClient.get as any)
        .mockResolvedValueOnce({ data: mockPage })
        .mockResolvedValueOnce(mockAttachments);

      const result = await handlers.downloadConfluencePageComplete({
        pageId: '456',
        includeAttachments: true,
        maxAttachmentSize: 50000000, // 50MB limit
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.attachments[0].skipped).toBe(true);
      expect(data.attachments[0].reason).toContain('exceeds maximum');
    });

    it('should filter attachments by type', async () => {
      const mockPage = {
        id: '789',
        title: 'Page with Filtered Attachments',
        body: { storage: { value: '' }, view: { value: '' } },
        _links: {},
      };

      const mockAttachments = {
        data: {
          results: [
            {
              id: 'att3',
              title: 'image.png',
              extensions: { mediaType: 'image/png', fileSize: 1000 },
              _links: { download: '/download/att3' },
            },
            {
              id: 'att4',
              title: 'doc.pdf',
              extensions: { mediaType: 'application/pdf', fileSize: 2000 },
              _links: { download: '/download/att4' },
            },
          ],
        },
      };

      (mockClient.get as any)
        .mockResolvedValueOnce({ data: mockPage })
        .mockResolvedValueOnce(mockAttachments)
        .mockResolvedValueOnce({ data: Buffer.from('image data') });

      const result = await handlers.downloadConfluencePageComplete({
        pageId: '789',
        includeAttachments: true,
        attachmentTypes: ['image/png'],
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      // Only image.png should be downloaded
      expect(data.attachments).toHaveLength(1);
      expect(data.attachments[0].title).toBe('image.png');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';
      
      (mockClient.get as any).mockRejectedValue(networkError);

      const result = await handlers.readConfluencePage({ pageId: '123' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Network error');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).response = { status: 401, data: { message: 'Invalid credentials' } };
      
      (mockClient.get as any).mockRejectedValue(authError);

      const result = await handlers.listConfluenceSpaces({});

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).response = { 
        status: 429, 
        headers: { 'retry-after': '60' } 
      };
      
      (mockClient.get as any).mockRejectedValue(rateLimitError);

      const result = await handlers.searchConfluencePages({ cql: 'test' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Too Many Requests');
    });
  });
});