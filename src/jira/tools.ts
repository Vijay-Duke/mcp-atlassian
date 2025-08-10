import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const jiraTools: Tool[] = [
  {
    name: 'read_jira_issue',
    description: 'Read details from a Jira issue by issue key',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The Jira issue key (e.g., "PROJ-123")',
        },
        expand: {
          type: 'string',
          description: 'Properties to expand (default: fields,transitions,changelog)',
          default: 'fields,transitions,changelog',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'search_jira_issues',
    description: 'Search for Jira issues using JQL (Jira Query Language)',
    inputSchema: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'JQL query string (e.g., "project = PROJ AND status = Open")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 50, max: 100)',
          default: 50,
          minimum: 1,
          maximum: 100,
        },
        startAt: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
          default: 0,
        },
        fields: {
          type: 'string',
          description: 'Fields to include in the response (default: *all)',
          default: '*all',
        },
      },
      required: ['jql'],
    },
  },
  {
    name: 'list_jira_projects',
    description: 'List available Jira projects',
    inputSchema: {
      type: 'object',
      properties: {
        expand: {
          type: 'string',
          description: 'Properties to expand (default: description,lead,issueTypes)',
          default: 'description,lead,issueTypes',
        },
      },
    },
  },
  {
    name: 'create_jira_issue',
    description: 'Create a new Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key where the issue will be created',
        },
        issueType: {
          type: 'string',
          description: 'The issue type (e.g., "Bug", "Task", "Story")',
        },
        summary: {
          type: 'string',
          description: 'The issue summary/title',
        },
        description: {
          type: 'string',
          description: 'The issue description (optional)',
        },
        priority: {
          type: 'string',
          description: 'The priority (e.g., "High", "Medium", "Low")',
        },
        assignee: {
          type: 'string',
          description: 'The assignee account ID',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add to the issue',
        },
        components: {
          type: 'array',
          items: { type: 'string' },
          description: 'Component names to add to the issue',
        },
        customFields: {
          type: 'object',
          description: 'Custom field values as key-value pairs',
        },
      },
      required: ['projectKey', 'issueType', 'summary'],
    },
  },
  {
    name: 'add_jira_comment',
    description: 'Add a comment to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The Jira issue key (e.g., "PROJ-123")',
        },
        body: {
          type: 'string',
          description: 'The comment text',
        },
        visibility: {
          type: 'object',
          description: 'Visibility restrictions for the comment',
          properties: {
            type: {
              type: 'string',
              enum: ['group', 'role'],
              description: 'Type of visibility restriction',
            },
            value: {
              type: 'string',
              description: 'The group name or role name',
            },
          },
        },
      },
      required: ['issueKey', 'body'],
    },
  },
];