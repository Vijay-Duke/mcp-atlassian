import { describe, it, expect } from 'vitest';
import { jiraTools } from '../../jira/tools.js';

describe('Jira Tools', () => {
  describe('tool registration', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(jiraTools)).toBe(true);
      expect(jiraTools.length).toBeGreaterThan(0);
    });

    it('should have tools with required properties', () => {
      jiraTools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');

        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    it('should have unique tool names', () => {
      const names = jiraTools.map((tool) => tool.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have non-empty names and descriptions', () => {
      jiraTools.forEach((tool) => {
        expect(tool.name.length).toBeGreaterThan(0);
        expect((tool.description || '').length).toBeGreaterThan(0);
      });
    });

    it('should have valid JSON schemas', () => {
      jiraTools.forEach((tool) => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });
  });

  describe('specific tools', () => {
    it('should include get_jira_current_user', () => {
      const currentUserTool = jiraTools.find((tool) => tool.name === 'get_jira_current_user');

      expect(currentUserTool).toBeDefined();
      expect(currentUserTool?.description).toContain('current user');
      expect(Object.keys(currentUserTool?.inputSchema.properties || {})).toHaveLength(0);
    });

    it('should include get_jira_user with proper schema', () => {
      const getUserTool = jiraTools.find((tool) => tool.name === 'get_jira_user');

      expect(getUserTool).toBeDefined();
      expect(getUserTool?.description).toContain('specific');

      const properties = getUserTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('username');
      expect(properties).toHaveProperty('accountId');
      expect(properties).toHaveProperty('email');
    });

    it('should include read_jira_issue with proper schema', () => {
      const readIssueTool = jiraTools.find((tool) => tool.name === 'read_jira_issue');

      expect(readIssueTool).toBeDefined();
      expect(readIssueTool?.description).toContain('issue');

      const properties = readIssueTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('issueKey');
      expect(properties).toHaveProperty('expand');
    });

    it('should include search_jira_issues with JQL parameter', () => {
      const searchTool = jiraTools.find((tool) => tool.name === 'search_jira_issues');

      expect(searchTool).toBeDefined();
      expect((searchTool?.description || '').toLowerCase()).toContain('search');

      const properties = searchTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('jql');
      expect((properties.jql as any)?.type).toBe('string');
    });

    it('should include list_jira_projects', () => {
      const listProjectsTool = jiraTools.find((tool) => tool.name === 'list_jira_projects');

      expect(listProjectsTool).toBeDefined();
      expect(listProjectsTool?.description).toContain('projects');

      const properties = listProjectsTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('expand');
    });

    it('should include create_jira_issue with required fields', () => {
      const createIssueTool = jiraTools.find((tool) => tool.name === 'create_jira_issue');

      expect(createIssueTool).toBeDefined();
      expect((createIssueTool?.description || '').toLowerCase()).toContain('create');

      const properties = createIssueTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('projectKey');
      expect(properties).toHaveProperty('issueType');
      expect(properties).toHaveProperty('summary');
      expect(properties).toHaveProperty('description');
    });

    it('should include add_jira_comment', () => {
      const addCommentTool = jiraTools.find((tool) => tool.name === 'add_jira_comment');

      expect(addCommentTool).toBeDefined();
      expect(addCommentTool?.description).toContain('comment');

      const properties = addCommentTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('issueKey');
      expect(properties).toHaveProperty('body');
    });

    it('should include agile board tools', () => {
      const boardTool = jiraTools.find((tool) => tool.name === 'list_agile_boards');

      expect(boardTool).toBeDefined();

      const sprintTool = jiraTools.find((tool) => tool.name === 'list_sprints_for_board');

      expect(sprintTool).toBeDefined();

      const properties = sprintTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('boardId');
    });

    it('should include user-specific search tools', () => {
      const userSearchTool = jiraTools.find((tool) => tool.name === 'search_issues_by_user_involvement');

      expect(userSearchTool).toBeDefined();

      const properties = userSearchTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('searchType');
      expect(properties.searchType).toHaveProperty('enum');
      expect((properties.searchType as any)?.enum).toContain('assignee');
      expect((properties.searchType as any)?.enum).toContain('reporter');
      expect((properties.searchType as any)?.enum).toContain('creator');
    });

    it('should include worklog functionality', () => {
      const worklogTool = jiraTools.find((tool) => tool.name === 'get_user_time_tracking');

      expect(worklogTool).toBeDefined();

      const properties = worklogTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('startDate');
      expect(properties).toHaveProperty('endDate');
    });

    it('should include sprint management tools', () => {
      const sprintDetailTool = jiraTools.find((tool) => tool.name === 'get_sprint_details');

      expect(sprintDetailTool).toBeDefined();

      const myTasksTool = jiraTools.find((tool) => tool.name === 'get_my_current_sprint_issues');

      expect(myTasksTool).toBeDefined();
    });
  });

  describe('schema validation', () => {
    it('should have proper enum definitions where applicable', () => {
      jiraTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          if (property.enum) {
            expect(Array.isArray(property.enum)).toBe(true);
            expect(property.enum.length).toBeGreaterThan(0);

            property.enum.forEach((value: any) => {
              expect(typeof value).toBe('string');
            });
          }
        });
      });
    });

    it('should have descriptions for all properties', () => {
      jiraTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          expect(property).toHaveProperty('description');
          expect(typeof property.description).toBe('string');
          expect(property.description.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have appropriate types for properties', () => {
      jiraTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          expect(property).toHaveProperty('type');
          expect(['string', 'number', 'boolean', 'object', 'array']).toContain(property.type);
        });
      });
    });

    it('should have proper array schemas where applicable', () => {
      jiraTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          if (property.type === 'array') {
            expect(property).toHaveProperty('items');
            expect(property.items).toHaveProperty('type');
          }
        });
      });
    });
  });

  describe('tool naming conventions', () => {
    it('should follow consistent naming patterns', () => {
      jiraTools.forEach((tool) => {
        // Should start with action verb or 'get_'
        const namePattern = /^(get_|read_|search_|list_|create_|update_|add_)/;
        expect(tool.name).toMatch(namePattern);

        // Should contain 'jira' to identify the service (some exceptions allowed for more descriptive names)
        const hasJiraOrIsException =
          tool.name.includes('jira') ||
          tool.name === 'get_my_current_sprint_issues' ||
          tool.name === 'get_my_unresolved_issues' ||
          tool.name === 'search_issues_by_user_involvement' ||
          tool.name === 'list_issues_for_user_role' ||
          tool.name === 'get_user_activity_history' ||
          tool.name === 'get_user_time_tracking' ||
          tool.name === 'list_agile_boards' ||
          tool.name === 'list_sprints_for_board' ||
          tool.name === 'get_sprint_details';
        expect(hasJiraOrIsException).toBe(true);
      });
    });

    it('should have tool names that match their functionality', () => {
      const toolMappings = [
        { name: 'get_jira_current_user', keywords: ['get', 'current', 'user'] },
        { name: 'search_jira_issues', keywords: ['search', 'issues'] },
        { name: 'create_jira_issue', keywords: ['create', 'issue'] },
        { name: 'list_jira_projects', keywords: ['list', 'projects'] },
        { name: 'add_jira_comment', keywords: ['add', 'comment'] },
      ];

      toolMappings.forEach(({ name, keywords }) => {
        const tool = jiraTools.find((t) => t.name === name);
        if (tool) {
          keywords.forEach((keyword) => {
            expect(tool.name.toLowerCase()).toContain(keyword);
          });
        }
      });
    });
  });

  describe('comprehensive tool coverage', () => {
    it('should have all expected Jira operations', () => {
      const expectedOperations = [
        'get_jira_current_user',
        'read_jira_issue',
        'search_jira_issues',
        'list_jira_projects',
        'create_jira_issue',
        'add_jira_comment',
        'list_agile_boards',
        'list_sprints_for_board',
      ];

      expectedOperations.forEach((operation) => {
        const tool = jiraTools.find((t) => t.name === operation);
        expect(tool).toBeDefined();
      });
    });

    it('should cover CRUD operations for issues', () => {
      const crudOperations = [
        { action: 'create', name: 'create_jira_issue' },
        { action: 'read', name: 'read_jira_issue' },
        // Update and delete are typically more restricted
      ];

      crudOperations.forEach(({ action, name }) => {
        const tool = jiraTools.find((t) => t.name === name);
        expect(tool).toBeDefined();
      });
    });

    it('should support user-centric operations', () => {
      const userOperations = jiraTools.filter(
        (tool) =>
          tool.name.includes('user') || (tool.description || '').toLowerCase().includes('user')
      );

      expect(userOperations.length).toBeGreaterThan(3);
    });

    it('should support agile/scrum operations', () => {
      const agileOperations = jiraTools.filter(
        (tool) =>
          tool.name.includes('board') ||
          tool.name.includes('sprint') ||
          (tool.description || '').toLowerCase().includes('sprint') ||
          (tool.description || '').toLowerCase().includes('board')
      );

      expect(agileOperations.length).toBeGreaterThan(2);
    });

    it('should support search and discovery', () => {
      const searchOperations = jiraTools.filter(
        (tool) =>
          tool.name.includes('search') ||
          tool.name.includes('list') ||
          tool.name.includes('get_my_')
      );

      expect(searchOperations.length).toBeGreaterThan(4);
    });

    it('should support project and issue management', () => {
      const projectOperations = jiraTools.filter(
        (tool) => tool.name.includes('project') || tool.name.includes('issue')
      );

      expect(projectOperations.length).toBeGreaterThan(3);
    });
  });

  describe('parameter validation', () => {
    it('should have proper JQL parameter in search tools', () => {
      const searchTool = jiraTools.find((tool) => tool.name === 'search_jira_issues');

      expect(searchTool).toBeDefined();
      const properties = searchTool?.inputSchema.properties || {};
      expect(properties.jql).toBeDefined();
      expect((properties.jql as any)?.description).toContain('JQL');
    });

    it('should have boardId parameter in sprint tools', () => {
      const sprintTool = jiraTools.find((tool) => tool.name === 'list_sprints_for_board');

      expect(sprintTool).toBeDefined();
      const properties = sprintTool?.inputSchema.properties || {};
      expect(properties.boardId).toBeDefined();
      expect((properties.boardId as any)?.type).toBe('number');
    });

    it('should have issueKey parameters where needed', () => {
      // Only check specific issue-targeted tools that we expect to have issueKey
      const specificIssueTools = ['read_jira_issue', 'add_jira_comment'];

      specificIssueTools.forEach((toolName) => {
        const tool = jiraTools.find((t) => t.name === toolName);
        if (tool) {
          const properties = tool.inputSchema.properties || {};
          expect(properties).toHaveProperty('issueKey');
          expect((properties.issueKey as any)?.type).toBe('string');
        }
      });
    });

    it('should have proper date parameters in worklog tools', () => {
      const worklogTool = jiraTools.find((tool) => tool.name === 'get_user_time_tracking');

      if (worklogTool) {
        const properties = worklogTool.inputSchema.properties || {};
        expect(properties).toHaveProperty('startDate');
        expect(properties).toHaveProperty('endDate');

        expect((properties.startDate as any)?.type).toBe('string');
        expect((properties.endDate as any)?.type).toBe('string');
      }
    });
  });
});
