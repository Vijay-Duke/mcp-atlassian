import { AxiosInstance } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { 
  ReadJiraIssueArgs, 
  SearchJiraIssuesArgs, 
  ListJiraProjectsArgs,
  CreateJiraIssueArgs,
  AddJiraCommentArgs,
  JiraIssue,
  JiraProject
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
}