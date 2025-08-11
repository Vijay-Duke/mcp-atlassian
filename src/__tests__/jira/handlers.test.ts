import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosInstance } from 'axios';
import { JiraHandlers } from '../../jira/handlers.js';

describe('JiraHandlers', () => {
  let mockClient: AxiosInstance;
  let handlers: JiraHandlers;

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

    handlers = new JiraHandlers(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
        transitions: [{ id: '21', name: 'In Progress', to: { name: 'In Progress' } }],
      };

      (mockClient.get as any).mockResolvedValue({ data: mockIssue });

      const result = await handlers.readJiraIssue({ issueKey: 'TEST-1' });

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/issue/TEST-1', {
        params: { expand: 'fields,transitions,changelog' },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.key).toBe('TEST-1');
      expect(data.fields.summary).toBe('Test Issue');
      expect(data.fields.status).toBe('Open');
      expect(data.transitions).toHaveLength(1);
    });

    it('should handle issue not found', async () => {
      const notFoundError = new Error('Issue not found');
      (notFoundError as any).response = { status: 404 };

      (mockClient.get as any).mockRejectedValue(notFoundError);

      const result = await handlers.readJiraIssue({ issueKey: 'NONEXIST-1' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Issue not found');
    });

    it('should validate issue key format', async () => {
      const result = await handlers.readJiraIssue({ issueKey: '' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('issueKey cannot be empty');
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

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalResults).toBe(1);
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].key).toBe('TEST-1');
    });

    it('should validate JQL query', async () => {
      const result = await handlers.searchJiraIssues({ jql: '' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('jql cannot be empty');
    });

    it('should limit results to 100 maximum', async () => {
      (mockClient.get as any).mockResolvedValue({
        data: { issues: [], total: 0, startAt: 0, maxResults: 100 },
      });

      const result = await handlers.searchJiraIssues({ jql: 'test', maxResults: 200 });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain(
        'maxResults must be an integer between 1 and 100'
      );
    });

    it('should handle pagination', async () => {
      (mockClient.get as any).mockResolvedValue({
        data: { issues: [], total: 100, startAt: 50, maxResults: 25 },
      });

      await handlers.searchJiraIssues({
        jql: 'project = TEST',
        startAt: 50,
        maxResults: 25,
        fields: 'summary,status',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
        params: {
          jql: 'project = TEST',
          maxResults: 25,
          startAt: 50,
          fields: 'summary,status',
        },
      });
    });

    it('should handle complex JQL queries', async () => {
      const complexJql =
        'project = TEST AND status in (Open, "In Progress") AND assignee = currentUser() ORDER BY priority DESC';

      (mockClient.get as any).mockResolvedValue({
        data: { issues: [], total: 0, startAt: 0, maxResults: 50 },
      });

      const result = await handlers.searchJiraIssues({ jql: complexJql });

      expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
        params: {
          jql: complexJql,
          maxResults: 50,
          startAt: 0,
          fields: '*all',
        },
      });

      expect(result.isError).toBeFalsy();
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

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalProjects).toBe(1);
      expect(data.projects[0].name).toBe('Test Project');
      expect(data.projects[0].issueTypes).toHaveLength(2);
    });

    it('should handle empty project list', async () => {
      (mockClient.get as any).mockResolvedValue({ data: [] });

      const result = await handlers.listJiraProjects({});

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.totalProjects).toBe(0);
      expect(data.projects).toHaveLength(0);
    });
  });

  describe('createJiraIssue', () => {
    it('should create issue successfully', async () => {
      const mockCreatedIssue = {
        id: '10002',
        key: 'TEST-2',
        self: 'https://test.atlassian.net/rest/api/3/issue/10002',
      };

      (mockClient.post as any).mockResolvedValue({ data: mockCreatedIssue });

      const result = await handlers.createJiraIssue({
        projectKey: 'TEST',
        issueType: 'Bug',
        summary: 'New Bug',
        description: 'Bug description',
        priority: 'High',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/rest/api/3/issue', {
        fields: {
          project: { key: 'TEST' },
          issuetype: { name: 'Bug' },
          summary: 'New Bug',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Bug description' }],
              },
            ],
          },
          priority: { name: 'High' },
        },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.key).toBe('TEST-2');
    });

    it('should create issue with assignee', async () => {
      (mockClient.post as any).mockResolvedValue({
        data: { id: '10003', key: 'TEST-3' },
      });

      await handlers.createJiraIssue({
        projectKey: 'TEST',
        issueType: 'Task',
        summary: 'Assigned Task',
        assignee: 'user1234567890',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            assignee: { accountId: 'user1234567890' },
          }),
        })
      );
    });

    it('should create issue with labels and components', async () => {
      (mockClient.post as any).mockResolvedValue({
        data: { id: '10004', key: 'TEST-4' },
      });

      await handlers.createJiraIssue({
        projectKey: 'TEST',
        issueType: 'Story',
        summary: 'Story with metadata',
        labels: ['frontend', 'urgent'],
        components: ['UI', 'Backend'],
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/rest/api/3/issue',
        expect.objectContaining({
          fields: expect.objectContaining({
            labels: ['frontend', 'urgent'],
            components: [{ name: 'UI' }, { name: 'Backend' }],
          }),
        })
      );
    });

    it('should validate required fields', async () => {
      const result = await handlers.createJiraIssue({
        projectKey: '',
        issueType: 'Bug',
        summary: 'Test',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('projectKey cannot be empty');
    });

    it('should handle creation errors', async () => {
      (mockClient.post as any).mockRejectedValue(new Error('Creation failed'));

      const result = await handlers.createJiraIssue({
        projectKey: 'TEST',
        issueType: 'Bug',
        summary: 'New Issue',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toBe('Creation failed');
    });
  });

  describe('addJiraComment', () => {
    it('should add comment successfully', async () => {
      const mockComment = {
        id: 'comment123',
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Test comment' }],
            },
          ],
        },
        author: { displayName: 'John Doe' },
        created: '2024-01-01T00:00:00.000Z',
      };

      (mockClient.post as any).mockResolvedValue({ data: mockComment });

      const result = await handlers.addJiraComment({
        issueKey: 'TEST-1',
        body: 'Test comment',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/rest/api/3/issue/TEST-1/comment', {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Test comment' }],
            },
          ],
        },
      });

      expect(result.isError).toBeFalsy();
      const data = JSON.parse((result.content[0] as any).text);
      expect(data.id).toBe('comment123');
      expect(data.author).toBe('John Doe');
    });

    it('should handle markdown comment', async () => {
      (mockClient.post as any).mockResolvedValue({
        data: { id: 'comment456' },
      });

      await handlers.addJiraComment({
        issueKey: 'TEST-2',
        body: '# Header\n\n- Item 1\n- Item 2',
      });

      const postCall = (mockClient.post as any).mock.calls[0];
      expect(postCall[1].body.content).toBeDefined();
      expect(postCall[1].body.type).toBe('doc');
    });

    it('should validate required fields', async () => {
      const result = await handlers.addJiraComment({
        issueKey: '',
        body: 'Test',
      });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('issueKey cannot be empty');
    });
  });

  describe('User-related methods', () => {
    describe('getJiraCurrentUser', () => {
      it('should get current user successfully', async () => {
        const mockUser = {
          accountId: 'user1234567890',
          displayName: 'John Doe',
          emailAddress: 'john@example.com',
          avatarUrls: { '48x48': 'avatar.png' },
          active: true,
          timeZone: 'America/New_York',
        };

        (mockClient.get as any).mockResolvedValue({ data: mockUser });

        const result = await handlers.getJiraCurrentUser();

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/myself');
        expect(result.isError).toBeFalsy();

        const data = JSON.parse((result.content[0] as any).text);
        expect(data.accountId).toBe('user1234567890');
        expect(data.displayName).toBe('John Doe');
      });
    });

    describe('getJiraUser', () => {
      it('should get user by accountId', async () => {
        const mockUser = {
          accountId: 'user456789012',
          displayName: 'Jane Smith',
          emailAddress: 'jane@example.com',
          active: true,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockUser });

        const result = await handlers.getJiraUser({ accountId: 'user456789012' });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/user', {
          params: { accountId: 'user456789012' },
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.displayName).toBe('Jane Smith');
      });

      it('should search user by email', async () => {
        const mockSearchResponse = [
          {
            accountId: 'user7890123456',
            displayName: 'Bob Wilson',
            emailAddress: 'bob@example.com',
          },
        ];

        (mockClient.get as any).mockResolvedValue({ data: mockSearchResponse });

        const result = await handlers.getJiraUser({ email: 'bob@example.com' });

        expect(result.isError).toBe(true);
        expect((result.content[0] as any).text).toContain(
          'Email-based user lookup has been disabled for privacy reasons'
        );
      });

      it('should validate user identification', async () => {
        const result = await handlers.getJiraUser({});

        expect(result.isError).toBe(true);
        expect((result.content[0] as any).text).toContain(
          '**User Not Found**: Could not locate user "unknown"'
        );
      });

      it('should handle user not found', async () => {
        (mockClient.get as any).mockResolvedValue({ data: [] });

        const result = await handlers.getJiraUser({ username: 'nonexistent' });

        expect(result.isError).toBe(true);
        expect((result.content[0] as any).text).toContain(
          '**User Not Found**: Could not locate user "nonexistent"'
        );
      });
    });

    describe('getMyOpenIssues', () => {
      it('should get current user open issues', async () => {
        const mockCurrentUser = {
          accountId: 'currentUser123',
          displayName: 'Current User',
        };

        const mockIssues = {
          issues: [
            {
              key: 'TEST-10',
              fields: {
                summary: 'My Task',
                status: { name: 'In Progress' },
                priority: { name: 'Medium' },
              },
            },
          ],
          total: 1,
        };

        (mockClient.get as any)
          .mockResolvedValueOnce({ data: mockCurrentUser })
          .mockResolvedValueOnce({ data: mockIssues });

        const result = await handlers.getMyOpenIssues({});

        expect(mockClient.get).toHaveBeenNthCalledWith(2, '/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('assignee = "currentUser123"'),
          }),
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalOpenIssues).toBe(1);
      });

      it('should filter by project', async () => {
        (mockClient.get as any)
          .mockResolvedValueOnce({ data: { accountId: 'user1234567890' } })
          .mockResolvedValueOnce({ data: { issues: [], total: 0 } });

        await handlers.getMyOpenIssues({ projectKeys: ['TEST'] });

        expect(mockClient.get).toHaveBeenNthCalledWith(2, '/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('project in ("TEST")'),
          }),
        });
      });

      it('should limit results with maxResults', async () => {
        (mockClient.get as any)
          .mockResolvedValueOnce({ data: { accountId: 'user1234567890' } })
          .mockResolvedValueOnce({ data: { issues: [], total: 0 } });

        await handlers.getMyOpenIssues({
          maxResults: 20,
        });

        expect(mockClient.get).toHaveBeenNthCalledWith(2, '/rest/api/3/search', {
          params: expect.objectContaining({
            maxResults: 20,
          }),
        });
      });
    });
  });

  describe('Board and Sprint methods', () => {
    describe('listJiraBoards', () => {
      it('should list boards successfully', async () => {
        const mockBoards = {
          values: [
            {
              id: 1,
              name: 'Scrum Board',
              type: 'scrum',
              location: { projectKey: 'TEST' },
            },
            {
              id: 2,
              name: 'Kanban Board',
              type: 'kanban',
              location: { projectKey: 'TEST' },
            },
          ],
          total: 2,
          startAt: 0,
          maxResults: 50,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockBoards });

        const result = await handlers.listJiraBoards({});

        expect(mockClient.get).toHaveBeenCalledWith('/rest/agile/1.0/board', {
          params: {
            maxResults: 50,
            startAt: 0,
          },
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalBoards).toBe(2);
        expect(data.boards).toHaveLength(2);
        expect(data.boards[0].name).toBe('Scrum Board');
      });

      it('should filter boards by project', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { values: [], total: 0 },
        });

        await handlers.listJiraBoards({ projectKeyOrId: 'TEST' });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/agile/1.0/board', {
          params: {
            maxResults: 50,
            startAt: 0,
            projectKeyOrId: 'TEST',
          },
        });
      });

      it('should filter boards by type', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { values: [], total: 0 },
        });

        await handlers.listJiraBoards({ type: 'scrum' });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/agile/1.0/board', {
          params: {
            maxResults: 50,
            startAt: 0,
            type: 'scrum',
          },
        });
      });
    });

    describe('listJiraSprints', () => {
      it('should list sprints successfully', async () => {
        const mockSprints = {
          values: [
            {
              id: 1,
              name: 'Sprint 1',
              state: 'active',
              startDate: '2024-01-01T00:00:00.000Z',
              endDate: '2024-01-14T23:59:59.999Z',
              boardId: 1,
            },
          ],
          total: 1,
          startAt: 0,
          maxResults: 50,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockSprints });

        const result = await handlers.listJiraSprints({ boardId: 1 });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/agile/1.0/board/1/sprint', {
          params: {
            maxResults: 50,
            startAt: 0,
          },
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalSprints).toBe(1);
        expect(data.sprints[0].name).toBe('Sprint 1');
      });

      it('should filter sprints by state', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { values: [], total: 0 },
        });

        await handlers.listJiraSprints({
          boardId: 1,
          state: 'active',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/agile/1.0/board/1/sprint', {
          params: {
            maxResults: 50,
            startAt: 0,
            state: 'active',
          },
        });
      });

      it('should validate required boardId', async () => {
        const result = await handlers.listJiraSprints({} as any);

        expect(result.isError).toBe(true);
        expect((result.content[0] as any).text).toContain('boardId is required');
      });
    });

    describe('getJiraSprint', () => {
      it('should get sprint without issues', async () => {
        const mockSprint = {
          id: 1,
          name: 'Sprint 1',
          state: 'active',
        };

        (mockClient.get as any)
          .mockResolvedValueOnce({ data: mockSprint })
          .mockResolvedValueOnce({ data: { issues: [], total: 0 } });

        const result = await handlers.getJiraSprint({
          sprintId: 1,
        });

        expect(mockClient.get).toHaveBeenCalledTimes(2);
        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.issues).toEqual([]);
      });
    });
  });

  describe('Activity and Worklog methods', () => {
    describe('searchJiraIssuesByUser', () => {
      it('should search issues by assignee', async () => {
        const mockIssues = {
          issues: [
            {
              key: 'TEST-20',
              fields: {
                summary: 'User task',
                assignee: { displayName: 'Jane Doe' },
                status: { name: 'Open' },
              },
            },
          ],
          total: 1,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockIssues });

        const result = await handlers.searchJiraIssuesByUser({
          accountId: 'user4567890123',
          searchType: 'assignee',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('assignee = "user4567890123"'),
          }),
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalIssues).toBe(1);
      });

      it('should search issues by reporter', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { issues: [], total: 0 },
        });

        await handlers.searchJiraIssuesByUser({
          accountId: 'user7890123456',
          searchType: 'reporter',
          projectKeys: ['TEST'],
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('reporter = "user7890123456"'),
          }),
        });
      });

      it('should search issues by watcher', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { issues: [], total: 0 },
        });

        await handlers.searchJiraIssuesByUser({
          accountId: 'user9990123456',
          searchType: 'watcher',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('watcher = "user9990123456"'),
          }),
        });
      });
    });

    describe('getUserJiraWorklog', () => {
      it('should get user worklog entries', async () => {
        const mockIssuesWithWorklog = {
          issues: [
            {
              key: 'TEST-40',
              fields: {
                summary: 'Task with worklog',
                worklog: {
                  worklogs: [
                    {
                      id: 'worklog1',
                      author: {
                        accountId: 'user1234567890',
                        displayName: 'John Doe',
                      },
                      timeSpent: '2h',
                      timeSpentSeconds: 7200,
                      started: '2024-01-10T09:00:00.000Z',
                      comment: 'Working on implementation',
                    },
                  ],
                  total: 1,
                },
              },
            },
          ],
          total: 1,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockIssuesWithWorklog });

        const result = await handlers.getUserJiraWorklog({
          accountId: 'user1234567890',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('worklogAuthor = "user1234567890"'),
            fields: 'summary,project,worklog',
            expand: 'worklog',
          }),
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalTimeSpentSeconds).toBe(7200);
        expect(data.totalTimeSpentFormatted).toBe('2h');
        expect(data.worklogs).toHaveLength(1);
        expect(data.worklogs[0].comment).toBe('Working on implementation');
      });

      it('should calculate total time correctly', async () => {
        const mockIssuesWithMultipleWorklogs = {
          issues: [
            {
              key: 'TEST-50',
              fields: {
                summary: 'Task 1',
                worklog: {
                  worklogs: [
                    {
                      author: { accountId: 'user1234567890' },
                      timeSpentSeconds: 3600, // 1h
                      started: '2024-01-10T09:00:00.000Z',
                    },
                    {
                      author: { accountId: 'user1234567890' },
                      timeSpentSeconds: 5400, // 1h 30m
                      started: '2024-01-11T09:00:00.000Z',
                    },
                  ],
                },
              },
            },
            {
              key: 'TEST-51',
              fields: {
                summary: 'Task 2',
                worklog: {
                  worklogs: [
                    {
                      author: { accountId: 'user1234567890' },
                      timeSpentSeconds: 7200, // 2h
                      started: '2024-01-12T09:00:00.000Z',
                    },
                  ],
                },
              },
            },
          ],
        };

        (mockClient.get as any).mockResolvedValue({ data: mockIssuesWithMultipleWorklogs });

        const result = await handlers.getUserJiraWorklog({
          accountId: 'user1234567890',
          startDate: '2024-01-01',
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalTimeSpentSeconds).toBe(16200); // 4h 30m total
        expect(data.totalTimeSpentFormatted).toBe('4h 30m');
        expect(data.worklogs).toHaveLength(3);
      });

      it('should filter by project', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { issues: [], total: 0 },
        });

        await handlers.getUserJiraWorklog({
          accountId: 'user1234567890',
          projectKeys: ['TEST'],
          startDate: '2024-01-01',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('project IN (\"TEST\")'),
          }),
        });
      });
    });

    describe('listUserJiraIssues', () => {
      it('should list issues created by user', async () => {
        const mockIssues = {
          issues: [
            {
              key: 'TEST-60',
              fields: {
                summary: 'Created by user',
                reporter: { displayName: 'John Doe' },
                created: '2024-01-05T10:00:00.000Z',
                status: { name: 'Open' },
              },
            },
          ],
          total: 1,
        };

        (mockClient.get as any).mockResolvedValue({ data: mockIssues });

        const result = await handlers.listUserJiraIssues({
          accountId: 'user1234567890',
          role: 'creator',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('creator = "user1234567890"'),
          }),
        });

        expect(result.isError).toBeFalsy();
        const data = JSON.parse((result.content[0] as any).text);
        expect(data.totalIssues).toBe(1);
        expect(data.issues[0].key).toBe('TEST-60');
      });

      it('should filter by project and status', async () => {
        (mockClient.get as any).mockResolvedValue({
          data: { issues: [], total: 0 },
        });

        await handlers.listUserJiraIssues({
          accountId: 'user1234567890',
          role: 'assignee',
          projectKeys: ['TEST'],
        });

        expect(mockClient.get).toHaveBeenCalledWith('/rest/api/3/search', {
          params: expect.objectContaining({
            jql: expect.stringContaining('assignee = "user1234567890"'),
          }),
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';

      (mockClient.get as any).mockRejectedValue(networkError);

      const result = await handlers.readJiraIssue({ issueKey: 'TEST-1' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Network error');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).response = { status: 401, data: { message: 'Invalid credentials' } };

      (mockClient.get as any).mockRejectedValue(authError);

      const result = await handlers.listJiraProjects({});

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).response = {
        status: 429,
        headers: { 'retry-after': '60' },
      };

      (mockClient.get as any).mockRejectedValue(rateLimitError);

      const result = await handlers.searchJiraIssues({ jql: 'test' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Too Many Requests');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Forbidden');
      (permissionError as any).response = {
        status: 403,
        data: { message: 'You do not have permission to view this issue' },
      };

      (mockClient.get as any).mockRejectedValue(permissionError);

      const result = await handlers.readJiraIssue({ issueKey: 'PRIVATE-1' });

      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('Forbidden');
    });
  });
});
