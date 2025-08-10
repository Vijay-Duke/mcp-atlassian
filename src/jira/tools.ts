import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const jiraTools: Tool[] = [
  {
    name: 'get_jira_current_user',
    description: 'Get details of the authenticated Jira user. Returns information about the current user including account ID, display name, email, and avatar URLs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'read_jira_issue',
    description: 'Retrieves detailed information about a specific Jira issue, including its fields, status, and transitions. Use this to get the full picture of a single issue.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The unique identifier for the Jira issue (e.g., "PROJ-123").',
        },
        expand: {
          type: 'string',
          description: 'A comma-separated list of additional properties to expand. Common options include `fields`, `transitions`, and `changelog`.',
          default: 'fields,transitions,changelog',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'search_jira_issues',
    description: 'Searches for Jira issues using Jira Query Language (JQL). This is the primary way to find issues that match specific criteria.',
    inputSchema: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'A JQL query string. For example, to find all open issues in project "PROJ", use: `project = PROJ AND status = Open`.',
        },
        maxResults: {
          type: 'number',
          description: 'The maximum number of issues to return. Default is 50, maximum is 100.',
          default: 50,
          minimum: 1,
          maximum: 100,
        },
        startAt: {
          type: 'number',
          description: 'The starting index for pagination. Default is 0.',
          default: 0,
        },
        fields: {
          type: 'string',
          description: 'A comma-separated list of fields to include for each issue in the response. By default, it returns all fields (`*all`).',
          default: '*all',
        },
      },
      required: ['jql'],
    },
  },
  {
    name: 'list_jira_projects',
    description: 'Lists all Jira projects that the user has permission to view. This is useful for discovering available projects to work with.',
    inputSchema: {
      type: 'object',
      properties: {
        expand: {
          type: 'string',
          description: 'A comma-separated list of properties to expand for each project. Common options are `description`, `lead`, and `issueTypes`.',
          default: 'description,lead,issueTypes',
        },
      },
    },
  },
  {
    name: 'create_jira_issue',
    description: 'Creates a new issue in a Jira project. You must specify the project, issue type, and a summary. Other fields like description, priority, and assignee are optional.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The key of the project in which the issue will be created (e.g., "PROJ").',
        },
        issueType: {
          type: 'string',
          description: 'The name of the issue type (e.g., "Bug", "Task", "Story"). This must be a valid issue type in the specified project.',
        },
        summary: {
          type: 'string',
          description: 'A concise summary or title for the issue.',
        },
        description: {
          type: 'string',
          description: 'A detailed description of the issue. Optional.',
        },
        priority: {
          type: 'string',
          description: 'The priority level for the issue (e.g., "High", "Medium", "Low"). Must be a valid priority in the project.',
        },
        assignee: {
          type: 'string',
          description: 'The Atlassian account ID of the user to whom the issue should be assigned.',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'A list of labels to add to the new issue.',
        },
        components: {
          type: 'array',
          items: { type: 'string' },
          description: 'A list of component names to associate with the new issue.',
        },
        customFields: {
          type: 'object',
          description: 'A JSON object for setting custom fields. The keys are the custom field IDs (e.g., "customfield_10010") and the values are the data to be set.',
        },
      },
      required: ['projectKey', 'issueType', 'summary'],
    },
  },
  {
    name: 'add_jira_comment',
    description: 'Adds a comment to an existing Jira issue. You can also control the visibility of the comment.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The key of the issue to which the comment will be added (e.g., "PROJ-123").',
        },
        body: {
          type: 'string',
          description: 'The text content of the comment.',
        },
        visibility: {
          type: 'object',
          description: 'An object that sets the visibility of the comment to a specific project role or group. Optional.',
          properties: {
            type: {
              type: 'string',
              enum: ['group', 'role'],
              description: 'The type of visibility restriction.',
            },
            value: {
              type: 'string',
              description: 'The name of the group or project role.',
            },
          },
        },
      },
      required: ['issueKey', 'body'],
    },
  },
  {
    name: 'list_jira_boards',
    description: 'List accessible Jira boards (Scrum and Kanban). Can be filtered by project and board type.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKeyOrId: {
          type: 'string',
          description: 'Filter boards by a specific project key or ID (e.g., "PROJ" or "10000").',
        },
        type: {
          type: 'string',
          enum: ['scrum', 'kanban'],
          description: 'Filter by board type: scrum or kanban.',
        },
        startAt: {
          type: 'number',
          description: 'The starting index for pagination. Default is 0.',
          default: 0,
        },
        maxResults: {
          type: 'number',
          description: 'The maximum number of boards to return. Default is 50, maximum is 50.',
          default: 50,
          minimum: 1,
          maximum: 50,
        },
      },
    },
  },
  {
    name: 'list_jira_sprints',
    description: 'List sprints for a given board. Can filter by sprint state (active, closed, future).',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The ID of the board to get sprints from.',
        },
        state: {
          type: 'string',
          enum: ['active', 'closed', 'future'],
          description: 'Filter sprints by state. If not provided, returns all sprints.',
        },
        startAt: {
          type: 'number',
          description: 'The starting index for pagination. Default is 0.',
          default: 0,
        },
        maxResults: {
          type: 'number',
          description: 'The maximum number of sprints to return. Default is 50, maximum is 50.',
          default: 50,
          minimum: 1,
          maximum: 50,
        },
      },
      required: ['boardId'],
    },
  },
  {
    name: 'get_jira_sprint',
    description: 'Get detailed information about a specific sprint, including its issues, dates, and goals.',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId: {
          type: 'number',
          description: 'The ID of the sprint to retrieve.',
        },
      },
      required: ['sprintId'],
    },
  },
  {
    name: 'get_my_tasks_in_current_sprint',
    description: 'Fetch all issues assigned to the current user in the active sprint(s). Optionally filter by board or project.',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'Optional board ID to get sprint-specific information.',
        },
        projectKey: {
          type: 'string',
          description: 'Optional project key to filter issues (e.g., "PROJ").',
        },
      },
    },
  },
  {
    name: 'get_my_open_issues',
    description: 'Fetch all open (unresolved) issues assigned to the current user. Returns issues grouped by status and sorted by priority.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKeys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of project keys to filter issues (e.g., ["PROJ1", "PROJ2"]).',
        },
        maxResults: {
          type: 'number',
          description: 'The maximum number of issues to return. Default is 50, maximum is 100.',
          default: 50,
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
];