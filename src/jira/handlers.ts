import { AxiosInstance } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { 
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
  GetJiraUserArgs,
  SearchJiraIssuesByUserArgs,
  ListUserJiraIssuesArgs,
  GetUserJiraActivityArgs,
  GetUserJiraWorklogArgs,
  JiraIssue,
  JiraProject,
  JiraUser,
  JiraBoard,
  JiraSprint
} from '../types/index.js';
import { formatApiError } from '../utils/http-client.js';

export class JiraHandlers {
  constructor(private client: AxiosInstance) {}

  async readJiraIssue(args: ReadJiraIssueArgs): Promise<CallToolResult> {
    try {
      const { issueKey, expand = 'fields,transitions,changelog' } = args;

      const response = await this.client.get(`/rest/api/3/issue/${issueKey}`, {
        params: { expand },
      });

      const issue: JiraIssue = response.data;
      
      const result = {
        id: issue.id,
        key: issue.key,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
        fields: {
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status?.name,
          priority: issue.fields.priority?.name,
          issueType: issue.fields.issuetype?.name,
          assignee: issue.fields.assignee?.displayName,
          reporter: issue.fields.reporter?.displayName,
          created: issue.fields.created,
          updated: issue.fields.updated,
          resolved: issue.fields.resolutiondate,
          labels: issue.fields.labels,
          components: issue.fields.components?.map((c: any) => c.name),
        },
        transitions: issue.transitions?.map(t => ({
          id: t.id,
          name: t.name,
          to: t.to.name,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async searchJiraIssues(args: SearchJiraIssuesArgs): Promise<CallToolResult> {
    try {
      const { jql, maxResults = 50, startAt = 0, fields = '*all' } = args;

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          startAt,
          fields,
        },
      });

      const issues = response.data.issues.map((issue: JiraIssue) => ({
        id: issue.id,
        key: issue.key,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
        fields: {
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          priority: issue.fields.priority?.name,
          issueType: issue.fields.issuetype?.name,
          assignee: issue.fields.assignee?.displayName,
          created: issue.fields.created,
          updated: issue.fields.updated,
        },
      }));

      const resultData = {
        totalResults: response.data.total,
        startAt: response.data.startAt,
        maxResults: response.data.maxResults,
        issues,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listJiraProjects(args: ListJiraProjectsArgs): Promise<CallToolResult> {
    try {
      const { expand = 'description,lead,issueTypes' } = args;

      const response = await this.client.get('/rest/api/3/project', {
        params: { expand },
      });

      const projects = response.data.map((project: JiraProject) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        projectType: project.projectTypeKey,
        lead: project.lead?.displayName,
        webUrl: `${this.client.defaults.baseURL}/projects/${project.key}`,
        issueTypes: project.issueTypes?.map(it => ({
          name: it.name,
          description: it.description,
        })),
      }));

      const resultData = {
        totalProjects: projects.length,
        projects,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async createJiraIssue(args: CreateJiraIssueArgs): Promise<CallToolResult> {
    try {
      const { 
        projectKey, 
        issueType, 
        summary, 
        description, 
        priority, 
        assignee,
        labels,
        components,
        customFields 
      } = args;

      const issueData: any = {
        fields: {
          project: { key: projectKey },
          issuetype: { name: issueType },
          summary,
        },
      };

      if (description) {
        issueData.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: description,
                },
              ],
            },
          ],
        };
      }

      if (priority) {
        issueData.fields.priority = { name: priority };
      }

      if (assignee) {
        issueData.fields.assignee = { accountId: assignee };
      }

      if (labels && labels.length > 0) {
        issueData.fields.labels = labels;
      }

      if (components && components.length > 0) {
        issueData.fields.components = components.map(name => ({ name }));
      }

      // Add custom fields
      if (customFields) {
        Object.assign(issueData.fields, customFields);
      }

      const response = await this.client.post('/rest/api/3/issue', issueData);

      const result = {
        id: response.data.id,
        key: response.data.key,
        self: response.data.self,
        webUrl: `${this.client.defaults.baseURL}/browse/${response.data.key}`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async addJiraComment(args: AddJiraCommentArgs): Promise<CallToolResult> {
    try {
      const { issueKey, body, visibility } = args;

      const commentData: any = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: body,
                },
              ],
            },
          ],
        },
      };

      if (visibility) {
        commentData.visibility = visibility;
      }

      const response = await this.client.post(
        `/rest/api/3/issue/${issueKey}/comment`,
        commentData
      );

      const result = {
        id: response.data.id,
        created: response.data.created,
        author: response.data.author?.displayName,
        body: body,
        issueKey: issueKey,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getJiraCurrentUser(): Promise<CallToolResult> {
    try {
      const response = await this.client.get('/rest/api/3/myself');
      
      const user: JiraUser = response.data;
      const result = {
        accountId: user.accountId,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
        active: user.active,
        timeZone: user.timeZone,
        accountType: user.accountType,
        avatarUrls: user.avatarUrls,
        profileUrl: `${this.client.defaults.baseURL}/people/${user.accountId}`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listJiraBoards(args: ListJiraBoardsArgs): Promise<CallToolResult> {
    try {
      const { projectKeyOrId, type, startAt = 0, maxResults = 50 } = args;
      
      const params: any = {
        startAt,
        maxResults: Math.min(maxResults, 50),
      };
      
      if (projectKeyOrId) {
        params.projectKeyOrId = projectKeyOrId;
      }
      
      if (type) {
        params.type = type;
      }

      const response = await this.client.get('/rest/agile/1.0/board', { params });
      
      const boards = response.data.values.map((board: JiraBoard) => ({
        id: board.id,
        name: board.name,
        type: board.type,
        projectKey: board.location?.projectKey,
        projectName: board.location?.projectName,
        webUrl: `${this.client.defaults.baseURL}/secure/RapidBoard.jspa?rapidView=${board.id}`,
      }));

      const resultData = {
        totalBoards: response.data.total || boards.length,
        startAt: response.data.startAt,
        maxResults: response.data.maxResults,
        boards,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listJiraSprints(args: ListJiraSprintsArgs): Promise<CallToolResult> {
    try {
      const { boardId, state, startAt = 0, maxResults = 50 } = args;
      
      const params: any = {
        startAt,
        maxResults: Math.min(maxResults, 50),
      };
      
      if (state) {
        params.state = state;
      }

      const response = await this.client.get(`/rest/agile/1.0/board/${boardId}/sprint`, { params });
      
      const sprints = response.data.values.map((sprint: JiraSprint) => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        completeDate: sprint.completeDate,
        goal: sprint.goal,
        originBoardId: sprint.originBoardId,
      }));

      const resultData = {
        totalSprints: response.data.total || sprints.length,
        startAt: response.data.startAt,
        maxResults: response.data.maxResults,
        boardId,
        sprints,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getJiraSprint(args: GetJiraSprintArgs): Promise<CallToolResult> {
    try {
      const { sprintId } = args;
      
      const response = await this.client.get(`/rest/agile/1.0/sprint/${sprintId}`);
      
      const sprint: JiraSprint = response.data;
      const result: any = {
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        completeDate: sprint.completeDate,
        goal: sprint.goal,
        originBoardId: sprint.originBoardId,
        webUrl: sprint.originBoardId 
          ? `${this.client.defaults.baseURL}/secure/RapidBoard.jspa?rapidView=${sprint.originBoardId}&view=planning&selectedIssue=none&sprint=${sprint.id}`
          : undefined,
      };

      // Get issues in the sprint
      try {
        const issuesResponse = await this.client.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
          params: { maxResults: 100 }
        });
        
        result.issueCount = issuesResponse.data.total;
        result.issues = issuesResponse.data.issues.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
        }));
      } catch (issuesError) {
        // If we can't get issues, continue without them
        console.error('Failed to get sprint issues:', issuesError);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getMyTasksInCurrentSprint(args: GetMyTasksInCurrentSprintArgs): Promise<CallToolResult> {
    try {
      // First get the current user
      const userResponse = await this.client.get('/rest/api/3/myself');
      const currentUser: JiraUser = userResponse.data;
      
      let jql = `assignee = "${currentUser.accountId}" AND sprint in openSprints()`;
      
      if (args.projectKey) {
        jql = `project = ${args.projectKey} AND ${jql}`;
      }

      // If a specific board is provided, we can get more specific sprint info
      let sprintInfo = null;
      if (args.boardId) {
        try {
          const sprintResponse = await this.client.get(`/rest/agile/1.0/board/${args.boardId}/sprint`, {
            params: { state: 'active' }
          });
          
          if (sprintResponse.data.values && sprintResponse.data.values.length > 0) {
            const activeSprint = sprintResponse.data.values[0];
            sprintInfo = {
              id: activeSprint.id,
              name: activeSprint.name,
              startDate: activeSprint.startDate,
              endDate: activeSprint.endDate,
            };
          }
        } catch (sprintError) {
          // Continue without sprint info
          console.error('Failed to get sprint info:', sprintError);
        }
      }

      // Search for issues
      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,status,priority,issuetype,created,updated,description,components,labels,sprint',
        },
      });

      const issues = response.data.issues.map((issue: JiraIssue) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype?.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
        sprint: issue.fields.sprint?.name,
      }));

      const resultData = {
        currentUser: currentUser.displayName,
        activeSprint: sprintInfo,
        totalIssues: response.data.total,
        issues,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getMyOpenIssues(args: GetMyOpenIssuesArgs): Promise<CallToolResult> {
    try {
      const { projectKeys, maxResults = 50 } = args;
      
      // First get the current user
      const userResponse = await this.client.get('/rest/api/3/myself');
      const currentUser: JiraUser = userResponse.data;
      
      let jql = `assignee = "${currentUser.accountId}" AND resolution = Unresolved`;
      
      if (projectKeys && projectKeys.length > 0) {
        const projectFilter = projectKeys.map(key => `"${key}"`).join(', ');
        jql = `project in (${projectFilter}) AND ${jql}`;
      }
      
      jql += ' ORDER BY priority DESC, updated DESC';

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          fields: 'summary,status,priority,issuetype,created,updated,project,components,labels,duedate',
        },
      });

      const issues = response.data.issues.map((issue: JiraIssue) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype?.name,
        project: issue.fields.project?.key,
        created: issue.fields.created,
        updated: issue.fields.updated,
        dueDate: issue.fields.duedate,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
        labels: issue.fields.labels,
        components: issue.fields.components?.map((c: any) => c.name),
      }));

      // Group issues by status
      const issuesByStatus: Record<string, any[]> = {};
      issues.forEach((issue: any) => {
        if (!issuesByStatus[issue.status]) {
          issuesByStatus[issue.status] = [];
        }
        issuesByStatus[issue.status].push(issue);
      });

      const resultData = {
        currentUser: currentUser.displayName,
        totalOpenIssues: response.data.total,
        issuesByStatus,
        allIssues: issues,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getJiraUser(args: GetJiraUserArgs): Promise<CallToolResult> {
    try {
      const { username, accountId, email } = args;
      
      // Search for user - Jira API is different from Confluence
      let user: JiraUser | null = null;
      
      if (accountId) {
        try {
          const response = await this.client.get(`/rest/api/3/user`, {
            params: { accountId }
          });
          user = response.data;
        } catch (e) {
          // User not found by accountId
        }
      }
      
      if (!user && username) {
        try {
          const response = await this.client.get('/rest/api/3/user/search', {
            params: { query: username, maxResults: 1 }
          });
          if (response.data && response.data.length > 0) {
            user = response.data[0];
          }
        } catch (e) {
          // User not found by username
        }
      }
      
      if (!user && email) {
        try {
          const response = await this.client.get('/rest/api/3/user/search', {
            params: { query: email, maxResults: 1 }
          });
          if (response.data && response.data.length > 0) {
            user = response.data[0];
          }
        } catch (e) {
          // User not found by email
        }
      }
      
      if (!user) {
        return {
          content: [{ type: 'text', text: 'User not found' }],
          isError: true,
        };
      }
      
      const result = {
        accountId: user.accountId,
        displayName: user.displayName,
        emailAddress: user.emailAddress,
        active: user.active,
        timeZone: user.timeZone,
        accountType: user.accountType,
        avatarUrls: user.avatarUrls,
        profileUrl: `${this.client.defaults.baseURL}/people/${user.accountId}`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async searchJiraIssuesByUser(args: SearchJiraIssuesByUserArgs): Promise<CallToolResult> {
    try {
      const { username, accountId, searchType, projectKeys, status, issueType, maxResults = 50, startAt = 0 } = args;
      
      // Get user's accountId if not provided
      let userAccountId = accountId;
      if (!userAccountId && username) {
        const userResult = await this.getJiraUser({ username });
        if (userResult.isError) {
          return userResult;
        }
        const userData = JSON.parse((userResult.content[0] as any).text);
        userAccountId = userData.accountId;
      }
      
      if (!userAccountId) {
        return {
          content: [{ type: 'text', text: 'User account ID or username is required' }],
          isError: true,
        };
      }
      
      // Build JQL query based on search type
      let jql = '';
      if (searchType === 'assignee') {
        jql = `assignee = "${userAccountId}"`;
      } else if (searchType === 'reporter') {
        jql = `reporter = "${userAccountId}"`;
      } else if (searchType === 'creator') {
        jql = `creator = "${userAccountId}"`;
      } else if (searchType === 'watcher') {
        jql = `watcher = "${userAccountId}"`;
      } else {
        jql = `(assignee = "${userAccountId}" OR reporter = "${userAccountId}" OR creator = "${userAccountId}" OR watcher = "${userAccountId}")`;
      }
      
      if (projectKeys && projectKeys.length > 0) {
        const projectFilter = projectKeys.map(key => `"${key}"`).join(', ');
        jql = `project in (${projectFilter}) AND ${jql}`;
      }
      
      if (status) {
        jql += ` AND status = "${status}"`;
      }
      
      if (issueType) {
        jql += ` AND issuetype = "${issueType}"`;
      }
      
      jql += ' ORDER BY updated DESC';

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          startAt,
          fields: 'summary,status,priority,issuetype,assignee,reporter,created,updated,project',
        },
      });

      const issues = response.data.issues.map((issue: JiraIssue) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype?.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        project: issue.fields.project?.key,
        created: issue.fields.created,
        updated: issue.fields.updated,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
      }));

      const resultData = {
        searchType,
        user: userAccountId,
        totalIssues: response.data.total,
        startAt: response.data.startAt,
        maxResults: response.data.maxResults,
        issues,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listUserJiraIssues(args: ListUserJiraIssuesArgs): Promise<CallToolResult> {
    try {
      const { username, accountId, role, projectKeys, startDate, endDate, maxResults = 50, startAt = 0 } = args;
      
      // Get user's accountId if not provided
      let userAccountId = accountId;
      if (!userAccountId && username) {
        const userResult = await this.getJiraUser({ username });
        if (userResult.isError) {
          return userResult;
        }
        const userData = JSON.parse((userResult.content[0] as any).text);
        userAccountId = userData.accountId;
      }
      
      if (!userAccountId) {
        return {
          content: [{ type: 'text', text: 'User account ID or username is required' }],
          isError: true,
        };
      }
      
      // Build JQL query
      let jql = `${role} = "${userAccountId}"`;
      
      if (projectKeys && projectKeys.length > 0) {
        const projectFilter = projectKeys.map(key => `"${key}"`).join(', ');
        jql = `project in (${projectFilter}) AND ${jql}`;
      }
      
      if (startDate && endDate) {
        jql += ` AND created >= "${startDate}" AND created <= "${endDate}"`;
      } else if (startDate) {
        jql += ` AND created >= "${startDate}"`;
      } else if (endDate) {
        jql += ` AND created <= "${endDate}"`;
      }
      
      jql += ' ORDER BY created DESC';

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          startAt,
          fields: 'summary,status,priority,issuetype,assignee,reporter,created,updated,project,resolution',
        },
      });

      const issues = response.data.issues.map((issue: JiraIssue) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        issueType: issue.fields.issuetype?.name,
        assignee: issue.fields.assignee?.displayName,
        reporter: issue.fields.reporter?.displayName,
        project: issue.fields.project?.key,
        resolution: issue.fields.resolution?.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        webUrl: `${this.client.defaults.baseURL}/browse/${issue.key}`,
      }));

      const resultData = {
        role,
        user: userAccountId,
        dateRange: {
          start: startDate || 'unlimited',
          end: endDate || 'unlimited'
        },
        totalIssues: response.data.total,
        startAt: response.data.startAt,
        maxResults: response.data.maxResults,
        issues,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getUserJiraActivity(args: GetUserJiraActivityArgs): Promise<CallToolResult> {
    try {
      const { username, accountId, activityType = 'all', projectKeys, days = 30, maxResults = 50, startAt = 0 } = args;
      
      // Get user's accountId if not provided
      let userAccountId = accountId;
      if (!userAccountId && username) {
        const userResult = await this.getJiraUser({ username });
        if (userResult.isError) {
          return userResult;
        }
        const userData = JSON.parse((userResult.content[0] as any).text);
        userAccountId = userData.accountId;
      }
      
      if (!userAccountId) {
        return {
          content: [{ type: 'text', text: 'User account ID or username is required' }],
          isError: true,
        };
      }
      
      // Calculate date range for activity
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Build JQL query for recent activity
      let jql = `(assignee = "${userAccountId}" OR reporter = "${userAccountId}" OR creator = "${userAccountId}")`;
      jql += ` AND updated >= -${days}d`;
      
      if (projectKeys && projectKeys.length > 0) {
        const projectFilter = projectKeys.map(key => `"${key}"`).join(', ');
        jql = `project in (${projectFilter}) AND ${jql}`;
      }
      
      jql += ' ORDER BY updated DESC';

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          startAt,
          fields: 'summary,status,priority,issuetype,assignee,reporter,created,updated,project,comment,worklog',
          expand: 'changelog',
        },
      });

      // Process issues and extract activity
      const activity: any[] = [];
      
      for (const issue of response.data.issues) {
        // Add issue updates
        if (issue.fields.updated) {
          const updatedDate = new Date(issue.fields.updated);
          if (updatedDate >= startDate) {
            activity.push({
              type: 'issue_updated',
              issueKey: issue.key,
              summary: issue.fields.summary,
              date: issue.fields.updated,
              project: issue.fields.project?.key,
            });
          }
        }
        
        // Add comments if requested
        if ((activityType === 'comments' || activityType === 'all') && issue.fields.comment?.comments) {
          for (const comment of issue.fields.comment.comments) {
            if (comment.author?.accountId === userAccountId) {
              const commentDate = new Date(comment.created);
              if (commentDate >= startDate) {
                activity.push({
                  type: 'comment',
                  issueKey: issue.key,
                  date: comment.created,
                  body: comment.body?.content?.[0]?.content?.[0]?.text || comment.body,
                });
              }
            }
          }
        }
        
        // Add transitions if requested
        if ((activityType === 'transitions' || activityType === 'all') && issue.changelog?.histories) {
          for (const history of issue.changelog.histories) {
            if (history.author?.accountId === userAccountId) {
              const changeDate = new Date(history.created);
              if (changeDate >= startDate) {
                for (const item of history.items) {
                  if (item.field === 'status') {
                    activity.push({
                      type: 'status_change',
                      issueKey: issue.key,
                      date: history.created,
                      from: item.fromString,
                      to: item.toString,
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      // Sort activity by date
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const resultData = {
        user: userAccountId,
        activityType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
        totalActivities: activity.length,
        activities: activity.slice(0, maxResults),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getUserJiraWorklog(args: GetUserJiraWorklogArgs): Promise<CallToolResult> {
    try {
      const { username, accountId, startDate, endDate, projectKeys, maxResults = 50, startAt = 0 } = args;
      
      // Get user's accountId if not provided
      let userAccountId = accountId;
      if (!userAccountId && username) {
        const userResult = await this.getJiraUser({ username });
        if (userResult.isError) {
          return userResult;
        }
        const userData = JSON.parse((userResult.content[0] as any).text);
        userAccountId = userData.accountId;
      }
      
      if (!userAccountId) {
        return {
          content: [{ type: 'text', text: 'User account ID or username is required' }],
          isError: true,
        };
      }
      
      // Build JQL to find issues with worklogs
      let jql = `worklogAuthor = "${userAccountId}"`;
      
      if (projectKeys && projectKeys.length > 0) {
        const projectFilter = projectKeys.map(key => `"${key}"`).join(', ');
        jql = `project in (${projectFilter}) AND ${jql}`;
      }
      
      if (startDate && endDate) {
        jql += ` AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;
      } else if (startDate) {
        jql += ` AND worklogDate >= "${startDate}"`;
      } else if (endDate) {
        jql += ` AND worklogDate <= "${endDate}"`;
      }

      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: Math.min(maxResults, 100),
          startAt,
          fields: 'summary,project,worklog',
          expand: 'worklog',
        },
      });

      const worklogs: any[] = [];
      let totalTimeSpent = 0;
      
      for (const issue of response.data.issues) {
        if (issue.fields.worklog?.worklogs) {
          for (const worklog of issue.fields.worklog.worklogs) {
            if (worklog.author?.accountId === userAccountId) {
              worklogs.push({
                issueKey: issue.key,
                summary: issue.fields.summary,
                project: issue.fields.project?.key,
                started: worklog.started,
                timeSpent: worklog.timeSpent,
                timeSpentSeconds: worklog.timeSpentSeconds,
                comment: worklog.comment?.content?.[0]?.content?.[0]?.text || worklog.comment,
                created: worklog.created,
                updated: worklog.updated,
              });
              totalTimeSpent += worklog.timeSpentSeconds || 0;
            }
          }
        }
      }
      
      // Sort worklogs by date
      worklogs.sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());

      const resultData = {
        user: userAccountId,
        dateRange: {
          start: startDate || 'unlimited',
          end: endDate || 'unlimited'
        },
        totalWorklogs: worklogs.length,
        totalTimeSpentSeconds: totalTimeSpent,
        totalTimeSpentFormatted: this.formatSeconds(totalTimeSpent),
        worklogs: worklogs.slice(0, maxResults),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  private formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const days = Math.floor(hours / 8); // Assuming 8-hour work day
    const remainingHours = hours % 8;
    
    if (days > 0) {
      return `${days}d ${remainingHours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}