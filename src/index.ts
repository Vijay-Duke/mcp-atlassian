#!/usr/bin/env node
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { createAtlassianClient } from './utils/http-client.js';
import { confluenceTools } from './confluence/tools.js';
import { jiraTools } from './jira/tools.js';
import { ConfluenceHandlers } from './confluence/handlers.js';
import { JiraHandlers } from './jira/handlers.js';
import { ToolRegistry } from './utils/tool-registry.js';
import { Logger } from './utils/logger.js';
import { createValidator, validators } from './utils/argument-validator.js';
import type { GetConfluenceUserArgs, ReadConfluencePageArgs } from './types/index.js';

// Get package version from package.json
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    Logger.warn('Could not read package.json version, using fallback', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return '0.0.0'; // Fallback version — real version read from package.json above
  }
}

// Generate a simple request ID for logging
function generateRequestId(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(6).toString('hex');
  return `req_${timestamp}_${randomPart}`;
}

class AtlassianMCPServer {
  private server: Server;
  private confluenceHandlers: ConfluenceHandlers;
  private jiraHandlers: JiraHandlers;
  private toolRegistry: ToolRegistry;

  constructor() {
    const version = getPackageVersion();

    this.server = new Server(
      {
        name: 'mcp-atlassian',
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const client = createAtlassianClient();
    this.confluenceHandlers = new ConfluenceHandlers(client);
    this.jiraHandlers = new JiraHandlers(client);
    this.toolRegistry = new ToolRegistry();

    Logger.info('Initializing Atlassian MCP Server', {
      version,
      environment: process.env.NODE_ENV ?? 'development',
    });

    this.registerTools();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private registerTools(): void {
    // Register all Confluence tools
    this.toolRegistry.register({
      name: 'get_confluence_current_user',
      handler: this.confluenceHandlers.getConfluenceCurrentUser.bind(this.confluenceHandlers),
      description: 'Get current Confluence user',
    });

    this.toolRegistry.register({
      name: 'get_confluence_user',
      handler: this.confluenceHandlers.getConfluenceUser.bind(this.confluenceHandlers),
      validator: this.createGetUserValidator(),
      description: 'Get specific Confluence user',
    });

    this.toolRegistry.register({
      name: 'read_confluence_page',
      handler: this.confluenceHandlers.readConfluencePage.bind(this.confluenceHandlers),
      validator: this.createReadPageValidator(),
      description: 'Read Confluence page content',
    });

    // Register other Confluence tools with basic validation
    // Tool names come from confluenceTools (advertised via ListTools) — single source of truth
    const confluenceHandlerMethods: Record<string, string> = {
      search_pages_by_user_involvement: 'searchConfluencePagesByUser',
      list_pages_created_by_user: 'listUserConfluencePages',
      list_attachments_uploaded_by_user: 'listUserConfluenceAttachments',
      search_confluence_pages: 'searchConfluencePages',
      list_confluence_spaces: 'listConfluenceSpaces',
      get_confluence_space: 'getConfluenceSpace',
      list_attachments_on_page: 'listConfluenceAttachments',
      download_confluence_attachment: 'downloadConfluenceAttachment',
      upload_confluence_attachment: 'uploadConfluenceAttachment',
      get_page_with_attachments: 'downloadConfluencePageComplete',
      create_confluence_page: 'createConfluencePage',
      update_confluence_page: 'updateConfluencePage',
      list_confluence_page_children: 'listConfluencePageChildren',
      list_confluence_page_ancestors: 'listConfluencePageAncestors',
      add_confluence_comment: 'addConfluenceComment',
      find_confluence_users: 'findConfluenceUsers',
      list_confluence_page_labels: 'getConfluenceLabels',
      add_confluence_page_label: 'addConfluenceLabels',
      export_confluence_page: 'exportConfluencePage',
      get_my_recent_confluence_pages: 'getMyRecentConfluencePages',
      get_confluence_pages_mentioning_me: 'getConfluencePagesMentioningMe',
    };

    confluenceTools.forEach((tool) => {
      if (this.toolRegistry.hasTool(tool.name)) return; // registered above with validator
      const methodName = confluenceHandlerMethods[tool.name];
      if (!methodName) {
        Logger.warn(`No handler registered for Confluence tool: ${tool.name}`);
        return;
      }
      this.toolRegistry.register({
        name: tool.name,
        handler: (
          this.confluenceHandlers as unknown as Record<string, () => Promise<CallToolResult>>
        )[methodName].bind(this.confluenceHandlers),
      });
    });

    // Register Jira tools
    this.toolRegistry.register({
      name: 'get_jira_current_user',
      handler: this.jiraHandlers.getJiraCurrentUser.bind(this.jiraHandlers),
      description: 'Get current Jira user',
    });

    const jiraHandlerMethods: Record<string, string> = {
      read_jira_issue: 'readJiraIssue',
      search_jira_issues: 'searchJiraIssues',
      list_jira_projects: 'listJiraProjects',
      create_jira_issue: 'createJiraIssue',
      add_jira_comment: 'addJiraComment',
      list_agile_boards: 'listJiraBoards',
      list_sprints_for_board: 'listJiraSprints',
      get_sprint_details: 'getJiraSprint',
      get_my_current_sprint_issues: 'getMyTasksInCurrentSprint',
      get_my_unresolved_issues: 'getMyOpenIssues',
      get_jira_user: 'getJiraUser',
      search_issues_by_user_involvement: 'searchJiraIssuesByUser',
      list_issues_by_user_role: 'listUserJiraIssues',
      get_user_activity_history: 'getUserJiraActivity',
      get_user_time_tracking: 'getUserJiraWorklog',
    };

    jiraTools.forEach((tool) => {
      if (this.toolRegistry.hasTool(tool.name)) return; // registered above
      const methodName = jiraHandlerMethods[tool.name];
      if (!methodName) {
        Logger.warn(`No handler registered for Jira tool: ${tool.name}`);
        return;
      }
      this.toolRegistry.register({
        name: tool.name,
        handler: (this.jiraHandlers as unknown as Record<string, () => Promise<CallToolResult>>)[
          methodName
        ].bind(this.jiraHandlers),
      });
    });

    Logger.info(`Registered ${this.toolRegistry.getRegisteredTools().length} tools`);
  }

  private createGetUserValidator() {
    return createValidator<GetConfluenceUserArgs>({
      accountId: validators.string('accountId'),
      username: validators.string('username'),
      email: validators.string('email'),
    });
  }

  private createReadPageValidator() {
    return createValidator<ReadConfluencePageArgs>({
      pageId: validators.string('pageId'),
      title: validators.string('title'),
      spaceKey: validators.string('spaceKey'),
      expand: validators.string('expand'),
      format: validators.enum('format', ['storage', 'markdown']),
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      Logger.debug('Listing available tools');
      return {
        tools: [...confluenceTools, ...jiraTools],
      };
    });

    // Handle tool calls using the registry
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const requestId = generateRequestId();
      const { name: toolName, arguments: args } = request.params;

      Logger.info(`Tool call received: ${toolName}`, {
        tool: toolName,
        requestId,
        hasArgs: !!args,
      });

      try {
        return await this.toolRegistry.execute(toolName, args, requestId);
      } catch (error) {
        Logger.logError('tool-execution-handler', error as Error, {
          tool: toolName,
          requestId,
        });

        return {
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'An unknown error occurred',
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception - shutting down', {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled promise rejection - shutting down', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
      process.exit(1);
    });

    process.on('SIGINT', () => {
      Logger.info('Received SIGINT - gracefully shutting down');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      Logger.info('Received SIGTERM - gracefully shutting down');
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      const version = getPackageVersion();
      Logger.info('Atlassian MCP server started successfully', {
        version,
        transport: 'stdio',
        toolsRegistered: this.toolRegistry.getRegisteredTools().length,
      });

      // Use Logger instead of console.error to avoid interfering with MCP protocol
      Logger.info(`Atlassian MCP server v${version} running on stdio`, {
        startupMessage: true,
      });
    } catch (error) {
      Logger.error('Failed to start MCP server', {
        error: error instanceof Error ? error : new Error(String(error)),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

const requiredEnvVars = ['ATLASSIAN_BASE_URL', 'ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    Logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const server = new AtlassianMCPServer();
server.run().catch((error) => {
  Logger.error('Failed to start server', { error });
  process.exit(1);
});
