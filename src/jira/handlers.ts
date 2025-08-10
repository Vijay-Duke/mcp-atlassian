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
}