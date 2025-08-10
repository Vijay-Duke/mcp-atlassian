import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosInstance } from 'axios';
import { JiraHandlers } from '../../jira/handlers.js';

describe('JiraHandlers', () => {
  let mockClient: AxiosInstance;
  let handlers: JiraHandlers;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      defaults: {
        baseURL: 'https://test.atlassian.net',
      },
    } as unknown as AxiosInstance;
    
    handlers = new JiraHandlers(mockClient);
  });

  describe('readJiraIssue', () => {
    it('should read issue successfully', async () => {
      const mockIssue = {
        id: '10001',
        key: 'TEST-1',
        self: 'https://test.atlassian.net/rest/api/3/issue/10001',
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
          status: { name: 'Open' },
          priority: { name: 'High' },
          issuetype: { name: 'Bug' },
          assignee: { displayName: 'John Doe' },
          reporter: { displayName: 'Jane Doe' },
          created: '2024-01-01T00:00:00.000Z',
          updated: '2024-01-02T00:00:00.000Z',
          resolutiondate: null,
          labels: ['test', 'bug'],
          components: [{ name: 'Backend' }],
        },
        transitions: [
          { id: '21', name: 'In Progress', to: { name: 'In Progress' } },
        ],
      };

      (mockClient.get as any).mockResolvedValue({ data: mockIssue });

      const result = await handlers.readJiraIssue({ issueKey: 'TEST-1' });

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/issue/TEST-1', {
        params: { expand: 'fields,transitions,changelog' },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.key).toBe('TEST-1');
      expect(data.fields.summary).toBe('Test Issue');
      expect(data.fields.status).toBe('Open');
      expect(data.transitions).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      (mockClient.get as any).mockRejectedValue(new Error('API Error'));

      const result = await handlers.readJiraIssue({ issueKey: 'TEST-1' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toBe('API Error');
    });
  });

  describe('searchJiraIssues', () => {
    it('should search issues successfully', async () => {
      const mockResponse = {
        data: {
          issues: [
            {
              id: '10001',
              key: 'TEST-1',
              fields: {
                summary: 'Test Issue',
                status: { name: 'Open' },
                priority: { name: 'High' },
                issuetype: { name: 'Bug' },
                assignee: { displayName: 'John Doe' },
                created: '2024-01-01T00:00:00.000Z',
                updated: '2024-01-02T00:00:00.000Z',
              },
            },
          ],
          total: 1,
          startAt: 0,
          maxResults: 50,
        },
      };

      (mockClient.get as any).mockResolvedValue(mockResponse);

      const result = await handlers.searchJiraIssues({ jql: 'project = TEST' });

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
        params: {
          jql: 'project = TEST',
          maxResults: 50,
          startAt: 0,
          fields: '*all',
        },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(1);
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].key).toBe('TEST-1');
    });

    it('should limit results to 100 maximum', async () => {
      (mockClient.get as any).mockResolvedValue({ 
        data: { issues: [], total: 0, startAt: 0, maxResults: 100 } 
      });

      const result = await handlers.searchJiraIssues({ jql: 'test', maxResults: 200 });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('maxResults must be an integer between 1 and 100');
    });
  });

  describe('listJiraProjects', () => {
    it('should list projects successfully', async () => {
      const mockProjects = [
        {
          id: '10000',
          key: 'TEST',
          name: 'Test Project',
          description: 'A test project',
          projectTypeKey: 'software',
          lead: { displayName: 'Project Lead' },
          issueTypes: [
            { name: 'Bug', description: 'A bug' },
            { name: 'Task', description: 'A task' },
          ],
        },
      ];

      (mockClient.get as any).mockResolvedValue({ data: mockProjects });

      const result = await handlers.listJiraProjects({});

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/project', {
        params: { expand: 'description,lead,issueTypes' },
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalProjects).toBe(1);
      expect(data.projects[0].name).toBe('Test Project');
      expect(data.projects[0].issueTypes).toHaveLength(2);
    });
  });
});