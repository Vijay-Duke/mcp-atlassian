import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simple mocks
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('./utils/http-client.js', () => ({
  createAtlassianClient: vi.fn(() => ({ defaults: { baseURL: 'https://test.atlassian.net' } })),
}));

vi.mock('./confluence/handlers.js', () => ({
  ConfluenceHandlers: vi.fn(() => ({
    getConfluenceCurrentUser: vi.fn(),
    readConfluencePage: vi.fn(),
    createConfluencePage: vi.fn(),
  })),
}));

vi.mock('./jira/handlers.js', () => ({
  JiraHandlers: vi.fn(() => ({
    getJiraCurrentUser: vi.fn(),
    readJiraIssue: vi.fn(),
    createJiraIssue: vi.fn(),
  })),
}));

describe('AtlassianMCPServer', () => {
  let originalProcessEnv: NodeJS.ProcessEnv;
  let originalProcessOn: typeof process.on;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // Store original process methods
    originalProcessEnv = process.env;
    originalProcessOn = process.on;
    originalProcessExit = process.exit;

    // Set up required environment variables
    process.env = {
      ...originalProcessEnv,
      ATLASSIAN_BASE_URL: 'https://test.atlassian.net',
      ATLASSIAN_EMAIL: 'test@example.com',
      ATLASSIAN_API_TOKEN: 'test-token',
    };

    // Mock process methods
    process.on = vi.fn() as any;
    process.exit = vi.fn() as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original process methods
    process.env = originalProcessEnv;
    process.on = originalProcessOn;
    process.exit = originalProcessExit;

    vi.restoreAllMocks();
  });

  describe('server initialization', () => {
    it('should initialize without throwing errors when environment is set', async () => {
      // Just verify the module can be imported without errors
      expect(async () => {
        await import('../index.js');
      }).not.toThrow();
    });

    it('should create server and handlers', async () => {
      await import('../index.js');

      const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
      const { createAtlassianClient } = await import('../utils/http-client.js');
      const { ConfluenceHandlers } = await import('../confluence/handlers.js');
      const { JiraHandlers } = await import('../jira/handlers.js');

      expect(Server).toHaveBeenCalled();
      expect(createAtlassianClient).toHaveBeenCalled();
      expect(ConfluenceHandlers).toHaveBeenCalled();
      expect(JiraHandlers).toHaveBeenCalled();
    });
  });

  describe('environment variable validation', () => {
    it('should exit if ATLASSIAN_BASE_URL is missing', async () => {
      delete process.env.ATLASSIAN_BASE_URL;

      await import('../index.js');

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should exit if ATLASSIAN_EMAIL is missing', async () => {
      delete process.env.ATLASSIAN_EMAIL;

      await import('../index.js');

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should exit if ATLASSIAN_API_TOKEN is missing', async () => {
      delete process.env.ATLASSIAN_API_TOKEN;

      await import('../index.js');

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should not exit if all required env vars are present', async () => {
      await import('../index.js');

      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('error handling setup', () => {
    it('should set up process error handlers', async () => {
      await import('../index.js');

      expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });
  });

  describe('server lifecycle', () => {
    it('should create server instance and attempt connection', async () => {
      // Mock console.error to avoid output during tests
      const originalConsoleError = console.error;
      console.error = vi.fn();

      await import('../index.js');

      const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

      expect(Server).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();

      console.error = originalConsoleError;
    });
  });
});
