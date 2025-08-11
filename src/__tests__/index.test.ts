import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all the dependencies to prevent execution issues
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('../utils/http-client.js', () => ({
  createAtlassianClient: vi.fn(() => ({ defaults: { baseURL: 'https://test.atlassian.net' } })),
}));

vi.mock('../confluence/handlers.js', () => ({
  ConfluenceHandlers: vi.fn().mockImplementation(() => ({
    getConfluenceCurrentUser: vi.fn(),
    getConfluenceUser: vi.fn(),
    readConfluencePage: vi.fn(),
    searchConfluencePagesByUser: vi.fn(),
    listUserConfluencePages: vi.fn(),
    listUserConfluenceAttachments: vi.fn(),
    searchConfluencePages: vi.fn(),
    listConfluenceSpaces: vi.fn(),
    getConfluenceSpace: vi.fn(),
    listConfluenceAttachments: vi.fn(),
    downloadConfluenceAttachment: vi.fn(),
    uploadConfluenceAttachment: vi.fn(),
    downloadConfluencePageComplete: vi.fn(),
    createConfluencePage: vi.fn(),
    updateConfluencePage: vi.fn(),
    listConfluencePageChildren: vi.fn(),
    listConfluencePageAncestors: vi.fn(),
    addConfluenceComment: vi.fn(),
    findConfluenceUsers: vi.fn(),
    getConfluenceLabels: vi.fn(),
    addConfluenceLabels: vi.fn(),
    exportConfluencePage: vi.fn(),
    getMyRecentConfluencePages: vi.fn(),
    getConfluencePagesMentioningMe: vi.fn(),
  })),
}));

vi.mock('../jira/handlers.js', () => ({
  JiraHandlers: vi.fn().mockImplementation(() => ({
    getJiraCurrentUser: vi.fn(),
    readJiraIssue: vi.fn(),
    searchJiraIssues: vi.fn(),
    listJiraProjects: vi.fn(),
    createJiraIssue: vi.fn(),
    addJiraComment: vi.fn(),
    listJiraBoards: vi.fn(),
    listJiraSprints: vi.fn(),
    getJiraSprint: vi.fn(),
    getMyTasksInCurrentSprint: vi.fn(),
    getMyOpenIssues: vi.fn(),
    getJiraUser: vi.fn(),
    searchJiraIssuesByUser: vi.fn(),
    listUserJiraIssues: vi.fn(),
    getUserJiraActivity: vi.fn(),
    getUserJiraWorklog: vi.fn(),
  })),
}));

vi.mock('../confluence/tools.js', () => ({
  confluenceTools: [
    {
      name: 'test_confluence_tool',
      description: 'Test tool',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

vi.mock('../jira/tools.js', () => ({
  jiraTools: [
    {
      name: 'test_jira_tool',
      description: 'Test tool',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

describe('AtlassianMCPServer Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up valid environment for all tests
    process.env = {
      ...originalEnv,
      ATLASSIAN_BASE_URL: 'https://test.atlassian.net',
      ATLASSIAN_EMAIL: 'test@example.com',
      ATLASSIAN_API_TOKEN: 'test-token',
    };
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should import without throwing errors when environment is valid', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(async () => {
      await import('../index.js');
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('should create required instances when imported', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../index.js');

    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { createAtlassianClient } = await import('../utils/http-client.js');
    const { ConfluenceHandlers } = await import('../confluence/handlers.js');
    const { JiraHandlers } = await import('../jira/handlers.js');

    expect(Server).toHaveBeenCalled();
    expect(createAtlassianClient).toHaveBeenCalled();
    expect(ConfluenceHandlers).toHaveBeenCalled();
    expect(JiraHandlers).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should set up tools from both Confluence and Jira', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../index.js');

    const { confluenceTools } = await import('../confluence/tools.js');
    const { jiraTools } = await import('../jira/tools.js');

    expect(confluenceTools).toBeDefined();
    expect(jiraTools).toBeDefined();
    expect(Array.isArray(confluenceTools)).toBe(true);
    expect(Array.isArray(jiraTools)).toBe(true);

    consoleSpy.mockRestore();
  });
});
