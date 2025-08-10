#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createAtlassianClient } from './utils/http-client.js';
import { confluenceTools } from './confluence/tools.js';
import { jiraTools } from './jira/tools.js';
import { ConfluenceHandlers } from './confluence/handlers.js';
import { JiraHandlers } from './jira/handlers.js';
import {
  ReadConfluencePageArgs,
  SearchConfluencePagesArgs,
  ListConfluenceSpacesArgs,
  ListConfluenceAttachmentsArgs,
  DownloadConfluenceAttachmentArgs,
  DownloadConfluencePageCompleteArgs,
  CreateConfluencePageArgs,
  UpdateConfluencePageArgs,
  AddConfluenceCommentArgs,
  FindConfluenceUsersArgs,
  GetConfluenceLabelsArgs,
  AddConfluenceLabelsArgs,
  ExportConfluencePageArgs,
  GetConfluenceSpaceArgs,
  ListConfluencePageChildrenArgs,
  ListConfluencePageAncestorsArgs,
  UploadConfluenceAttachmentArgs,
  GetMyRecentConfluencePagesArgs,
  GetConfluencePagesMentioningMeArgs,
  ReadJiraIssueArgs,
  SearchJiraIssuesArgs,
  ListJiraProjectsArgs,
  CreateJiraIssueArgs,
  AddJiraCommentArgs,
  ListJiraBoardsArgs,
  ListJiraSprintsArgs,
  GetJiraSprintArgs,
  GetMyTasksInCurrentSprintArgs,
  GetMyOpenIssuesArgs,
} from './types/index.js';

class AtlassianMCPServer {
  private server: Server;
  private confluenceHandlers: ConfluenceHandlers;
  private jiraHandlers: JiraHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-atlassian',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Create HTTP client and handlers
    const client = createAtlassianClient();
    this.confluenceHandlers = new ConfluenceHandlers(client);
    this.jiraHandlers = new JiraHandlers(client);

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...confluenceTools, ...jiraTools],
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          // Confluence tools
          case 'get_confluence_current_user':
            return await this.confluenceHandlers.getConfluenceCurrentUser();
          case 'read_confluence_page':
            return await this.confluenceHandlers.readConfluencePage(
              request.params.arguments as unknown as ReadConfluencePageArgs
            );
          case 'search_confluence_pages':
            return await this.confluenceHandlers.searchConfluencePages(
              request.params.arguments as unknown as SearchConfluencePagesArgs
            );
          case 'list_confluence_spaces':
            return await this.confluenceHandlers.listConfluenceSpaces(
              request.params.arguments as unknown as ListConfluenceSpacesArgs
            );
          case 'get_confluence_space':
            return await this.confluenceHandlers.getConfluenceSpace(
              request.params.arguments as unknown as GetConfluenceSpaceArgs
            );
          case 'list_confluence_attachments':
            return await this.confluenceHandlers.listConfluenceAttachments(
              request.params.arguments as unknown as ListConfluenceAttachmentsArgs
            );
          case 'download_confluence_attachment':
            return await this.confluenceHandlers.downloadConfluenceAttachment(
              request.params.arguments as unknown as DownloadConfluenceAttachmentArgs
            );
          case 'upload_confluence_attachment':
            return await this.confluenceHandlers.uploadConfluenceAttachment(
              request.params.arguments as unknown as UploadConfluenceAttachmentArgs
            );
          case 'download_confluence_page_complete':
            return await this.confluenceHandlers.downloadConfluencePageComplete(
              request.params.arguments as unknown as DownloadConfluencePageCompleteArgs
            );
          case 'create_confluence_page':
            return await this.confluenceHandlers.createConfluencePage(
              request.params.arguments as unknown as CreateConfluencePageArgs
            );
          case 'update_confluence_page':
            return await this.confluenceHandlers.updateConfluencePage(
              request.params.arguments as unknown as UpdateConfluencePageArgs
            );
          case 'list_confluence_page_children':
            return await this.confluenceHandlers.listConfluencePageChildren(
              request.params.arguments as unknown as ListConfluencePageChildrenArgs
            );
          case 'list_confluence_page_ancestors':
            return await this.confluenceHandlers.listConfluencePageAncestors(
              request.params.arguments as unknown as ListConfluencePageAncestorsArgs
            );
          case 'add_confluence_comment':
            return await this.confluenceHandlers.addConfluenceComment(
              request.params.arguments as unknown as AddConfluenceCommentArgs
            );
          case 'find_confluence_users':
            return await this.confluenceHandlers.findConfluenceUsers(
              request.params.arguments as unknown as FindConfluenceUsersArgs
            );
          case 'list_confluence_page_labels':
            return await this.confluenceHandlers.getConfluenceLabels(
              request.params.arguments as unknown as GetConfluenceLabelsArgs
            );
          case 'add_confluence_page_label':
            return await this.confluenceHandlers.addConfluenceLabels(
              request.params.arguments as unknown as AddConfluenceLabelsArgs
            );
          case 'export_confluence_page':
            return await this.confluenceHandlers.exportConfluencePage(
              request.params.arguments as unknown as ExportConfluencePageArgs
            );
          case 'get_my_recent_confluence_pages':
            return await this.confluenceHandlers.getMyRecentConfluencePages(
              request.params.arguments as unknown as GetMyRecentConfluencePagesArgs
            );
          case 'get_confluence_pages_mentioning_me':
            return await this.confluenceHandlers.getConfluencePagesMentioningMe(
              request.params.arguments as unknown as GetConfluencePagesMentioningMeArgs
            );

          // Jira tools
          case 'get_jira_current_user':
            return await this.jiraHandlers.getJiraCurrentUser();
          case 'read_jira_issue':
            return await this.jiraHandlers.readJiraIssue(
              request.params.arguments as unknown as ReadJiraIssueArgs
            );
          case 'search_jira_issues':
            return await this.jiraHandlers.searchJiraIssues(
              request.params.arguments as unknown as SearchJiraIssuesArgs
            );
          case 'list_jira_projects':
            return await this.jiraHandlers.listJiraProjects(
              request.params.arguments as unknown as ListJiraProjectsArgs
            );
          case 'create_jira_issue':
            return await this.jiraHandlers.createJiraIssue(
              request.params.arguments as unknown as CreateJiraIssueArgs
            );
          case 'add_jira_comment':
            return await this.jiraHandlers.addJiraComment(
              request.params.arguments as unknown as AddJiraCommentArgs
            );
          case 'list_jira_boards':
            return await this.jiraHandlers.listJiraBoards(
              request.params.arguments as unknown as ListJiraBoardsArgs
            );
          case 'list_jira_sprints':
            return await this.jiraHandlers.listJiraSprints(
              request.params.arguments as unknown as ListJiraSprintsArgs
            );
          case 'get_jira_sprint':
            return await this.jiraHandlers.getJiraSprint(
              request.params.arguments as unknown as GetJiraSprintArgs
            );
          case 'get_my_tasks_in_current_sprint':
            return await this.jiraHandlers.getMyTasksInCurrentSprint(
              request.params.arguments as unknown as GetMyTasksInCurrentSprintArgs
            );
          case 'get_my_open_issues':
            return await this.jiraHandlers.getMyOpenIssues(
              request.params.arguments as unknown as GetMyOpenIssuesArgs
            );

          default:
            return {
              content: [{ 
                type: 'text', 
                text: `Unknown tool: ${request.params.name}` 
              }],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: error instanceof Error ? error.message : 'An unknown error occurred' 
          }],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Atlassian MCP server running on stdio');
  }
}

// Check for required environment variables
const requiredEnvVars = ['ATLASSIAN_BASE_URL', 'ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Start the server
const server = new AtlassianMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});